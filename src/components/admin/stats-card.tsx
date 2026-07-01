
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  color?: "primary" | "blue" | "green" | "orange" | "purple" | "red";
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  red: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export function StatsCard({ title, value, description, icon: Icon, trend, color = "primary" }: StatsCardProps) {
  return (
    <Card className="rounded-[32px] border-none bg-white dark:bg-card shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">{title}</span>
                <h3 className="text-2xl font-black pt-1">{value}</h3>
             </div>
             {trend && (
               <div className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black",
                    trend.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {trend.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.value}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">مقارنة بأمس</span>
               </div>
             )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner", colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
