import React from "react";
import { format, differenceInDays } from "date-fns";
import { Calendar, Flag, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LeaseTimelineProps {
  startDate: string;
  endDate: string;
}

const LeaseTimeline = ({ startDate, endDate }: LeaseTimelineProps) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Reset times for accurate day calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const totalDays = differenceInDays(end, start);
  const daysElapsed = differenceInDays(today, start);
  const daysRemaining = differenceInDays(end, today);
  
  // Calculate positions as percentages
  const currentPosition = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
  const halfwayPosition = 50;
  const warningPosition = Math.max(0, ((totalDays - 30) / totalDays) * 100);
  
  const isExpired = today > end;
  const hasStarted = today >= start;
  const isInWarningPeriod = daysRemaining <= 30 && daysRemaining > 0;
  
  // Milestones
  const milestones = [
    {
      position: 0,
      date: start,
      label: "Lease Start",
      icon: Flag,
      color: "text-green-600",
      bgColor: "bg-green-100",
      passed: hasStarted,
    },
    {
      position: halfwayPosition,
      date: new Date(start.getTime() + (totalDays / 2) * 24 * 60 * 60 * 1000),
      label: "Halfway",
      icon: CheckCircle2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      passed: currentPosition >= halfwayPosition,
    },
    {
      position: warningPosition,
      date: new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000),
      label: "30 Days Notice",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      passed: currentPosition >= warningPosition,
    },
    {
      position: 100,
      date: end,
      label: "Lease End",
      icon: Calendar,
      color: isExpired ? "text-destructive" : "text-primary",
      bgColor: isExpired ? "bg-destructive/10" : "bg-primary/10",
      passed: isExpired,
    },
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-medium">Lease Timeline</span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isExpired 
            ? "bg-destructive/10 text-destructive" 
            : isInWarningPeriod 
              ? "bg-yellow-100 text-yellow-700" 
              : "bg-green-100 text-green-700"
        }`}>
          {isExpired 
            ? "Expired" 
            : `${daysRemaining} days remaining`
          }
        </span>
      </div>

      {/* Timeline Bar */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          {/* Progress Fill */}
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isExpired 
                ? "bg-destructive" 
                : isInWarningPeriod 
                  ? "bg-gradient-to-r from-green-500 via-yellow-500 to-yellow-500" 
                  : "bg-gradient-to-r from-green-500 to-primary"
            }`}
            style={{ width: `${currentPosition}%` }}
          />
        </div>

        {/* Current Position Marker */}
        {!isExpired && hasStarted && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="relative -translate-x-1/2">
              <div className="w-5 h-5 bg-primary rounded-full border-2 border-background shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-background rounded-full" />
              </div>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Milestone Markers */}
        {milestones.map((milestone, index) => (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${milestone.position}%` }}
          >
            <div className={`w-2 h-2 rounded-full ${
              milestone.passed ? milestone.bgColor : "bg-muted-foreground/30"
            } ${milestone.position === 0 ? "" : "-translate-x-1/2"} ${milestone.position === 100 ? "-translate-x-full" : ""}`} />
          </div>
        ))}
      </div>

      {/* Milestone Cards */}
      <div className="grid grid-cols-2 gap-3">
        {milestones.map((milestone, index) => {
          const Icon = milestone.icon;
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-all ${
                milestone.passed 
                  ? `${milestone.bgColor} border-transparent` 
                  : "bg-muted/30 border-border"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-md ${milestone.passed ? milestone.bgColor : "bg-muted"}`}>
                  <Icon className={`h-3.5 w-3.5 ${milestone.passed ? milestone.color : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${milestone.passed ? milestone.color : "text-muted-foreground"}`}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {format(milestone.date, "MMM d, yyyy")}
                  </p>
                </div>
                {milestone.passed && (
                  <CheckCircle2 className={`h-3.5 w-3.5 ${milestone.color} flex-shrink-0`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{Math.max(0, daysElapsed)}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Elapsed</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">{totalDays}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Days</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className={`text-lg font-bold ${isExpired ? "text-destructive" : isInWarningPeriod ? "text-yellow-600" : "text-green-600"}`}>
            {Math.max(0, daysRemaining)}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Left</p>
        </div>
      </div>
    </div>
  );
};

export default LeaseTimeline;
