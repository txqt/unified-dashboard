import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

interface StatusCardProps {
    title: string;
    value: string | number;
    metricKey: string;
    subtext?: string;
    status?: "success" | "warning" | "error" | "neutral";
    icon?: React.ElementType;
    className?: string;
}

export function StatusCard({ title, value, subtext, status = "neutral", icon: Icon, className }: StatusCardProps) {
    // Glassmorphism Base Styles
    const baseStyles = "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 group";

    // Status Logic
    let statusStyles = "";
    let glowColor = "";
    let IconComponent = Icon || Activity;
    let trendIcon = null;

    switch (status) {
        case "success":
            statusStyles = "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10";
            glowColor = "shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]";
            if (!Icon) IconComponent = CheckCircle2;
            trendIcon = <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
            break;
        case "warning":
            statusStyles = "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10";
            glowColor = "shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]";
            if (!Icon) IconComponent = AlertCircle;
            trendIcon = <Minus className="w-4 h-4 text-amber-400" />;
            break;
        case "error":
            statusStyles = "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10";
            glowColor = "shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]";
            if (!Icon) IconComponent = AlertCircle;
            trendIcon = <ArrowDownRight className="w-4 h-4 text-rose-400" />;
            break;
        case "neutral":
        default:
            statusStyles = "border-white/5 bg-white/5 hover:bg-white/10";
            glowColor = "shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)]";
            trendIcon = <Minus className="w-4 h-4 text-slate-400" />;
            break;
    }

    return (
        <div className={cn(baseStyles, statusStyles, glowColor, className)}>
            <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className={cn("p-2 rounded-lg bg-white/5 ring-1 ring-white/10 transition-colors group-hover:scale-110",
                        status === 'success' && "text-emerald-400",
                        status === 'error' && "text-rose-400",
                        status === 'warning' && "text-amber-400",
                        status === 'neutral' && "text-slate-400"
                    )}>
                        <IconComponent className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
                    </div>
                    {subtext && (
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            {trendIcon}
                            <span>{subtext}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Gradient Blob for visual seasoning */}
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity",
                status === 'success' && "bg-emerald-500",
                status === 'error' && "bg-rose-500",
                status === 'warning' && "bg-amber-500",
                status === 'neutral' && "bg-slate-500"
            )} />
        </div>
    );
}
