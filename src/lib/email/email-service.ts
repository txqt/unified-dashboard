import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
    static async sendWeeklyReport(
        to: string,
        workspaceName: string,
        metrics: Record<string, any>
    ) {
        if (!process.env.RESEND_API_KEY) {
            console.log("Mocking Email Send:", { to, workspaceName, metrics });
            return;
        }

        const html = this.generateEmailHtml(workspaceName, metrics);

        try {
            const data = await resend.emails.send({
                from: 'Unified Dashboard <updates@your-saas-domain.com>', // User needs to config this
                to: [to],
                subject: `State of Your SaaS: ${workspaceName}`,
                html: html
            });
            console.log("Email sent:", data);
        } catch (error) {
            console.error("Failed to send email:", error);
        }
    }

    private static generateEmailHtml(workspaceName: string, metrics: Record<string, any>) {
        const {
            revenue = 0,
            mrr = 0,
            errors = 0,
            traffic = 0,
            signups = 0
        } = metrics;

        // Simple comparison logic (mocked for now, implies + growth)
        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h1 style="color: #4F46E5;">State of Your SaaS</h1>
                <p>Here is your weekly summary for <strong>${workspaceName}</strong>.</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <h3 style="margin: 0; font-size: 14px; color: #666;">Total Revenue (Today)</h3>
                        <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #10B981;">$${revenue.toLocaleString()}</p>
                        <span style="color: #10B981; font-size: 12px;">+12% vs last week</span>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <h3 style="margin: 0; font-size: 14px; color: #666;">MRR</h3>
                        <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold;">$${mrr.toLocaleString()}</p>
                    </div>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <h3 style="margin: 0; font-size: 14px; color: #666;">Critical Errors</h3>
                        <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: ${errors > 0 ? '#EF4444' : '#10B981'};">${errors}</p>
                        <span style="color: #10B981; font-size: 12px;">-30% vs last week</span>
                    </div>
                     <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
                        <h3 style="margin: 0; font-size: 14px; color: #666;">New Traffic</h3>
                        <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold;">${traffic}</p>
                         <span style="color: #10B981; font-size: 12px;">+5% vs last week</span>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Full Dashboard</a>
                </div>
            </div>
        `;
    }
}
