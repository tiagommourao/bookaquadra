
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, CalendarCheck, CalendarRange, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventsStatsProps {
  stats?: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
  };
  isLoading: boolean;
}

export const EventStatCards: React.FC<EventsStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16" />
              </CardContent>
            </Card>
          ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total de Eventos",
      value: stats.total,
      icon: <Calendar className="h-6 w-6 text-gray-500" />,
    },
    {
      title: "Eventos Ativos",
      value: stats.active,
      icon: <CalendarRange className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Eventos Próximos",
      value: stats.upcoming,
      icon: <CalendarClock className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "Eventos Finalizados",
      value: stats.completed,
      icon: <CalendarCheck className="h-6 w-6 text-purple-500" />,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
