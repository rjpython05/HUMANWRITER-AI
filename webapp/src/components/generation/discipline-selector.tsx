"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Cpu, Users, Microscope, Sprout, LucideIcon } from "lucide-react";

const disciplines = [
  {
    id: "engineering",
    name: "Engineering",
    icon: Cpu,
    description: "Technical and engineering texts",
    color: "text-blue-500",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  {
    id: "social_sciences",
    name: "Social Sciences",
    icon: Users,
    description: "Social and humanities texts",
    color: "text-purple-500",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  {
    id: "natural_sciences",
    name: "Natural Sciences",
    icon: Microscope,
    description: "Scientific and research texts",
    color: "text-green-500",
    bgColor: "bg-green-50 hover:bg-green-100",
  },
  {
    id: "agricultural_sciences",
    name: "Agricultural Sciences",
    icon: Sprout,
    description: "Agricultural and environmental texts",
    color: "text-amber-500",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
];

interface DisciplineSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DisciplineSelector({ value, onChange }: DisciplineSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {disciplines.map((discipline) => (
        <Card
          key={discipline.id}
          className={cn(
            "p-4 cursor-pointer transition-all",
            discipline.bgColor,
            value === discipline.id
              ? "ring-2 ring-primary shadow-md"
              : "hover:shadow-md"
          )}
          onClick={() => onChange(discipline.id)}
        >
          <div className="flex items-start space-x-3">
            <discipline.icon className={cn("h-6 w-6 mt-1", discipline.color)} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{discipline.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {discipline.description}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
