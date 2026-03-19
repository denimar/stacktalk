"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECTS } from "@/lib/types";
import { FolderOpen } from "lucide-react";

interface ProjectSelectorProps {
  value: string;
  onChange: (projectId: string) => void;
  disabled?: boolean;
}

export function ProjectSelector({ value, onChange, disabled }: ProjectSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <FolderOpen className="size-4 text-muted-foreground shrink-0" />
      <Select value={value} onValueChange={(val) => { if (val) onChange(val); }} disabled={disabled}>
        <SelectTrigger className="w-[320px]">
          <SelectValue placeholder="Select a project..." />
        </SelectTrigger>
        <SelectContent>
          {PROJECTS.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <div className="flex flex-col">
                <span className="font-medium">{project.name}</span>
                <span className="text-xs text-muted-foreground">{project.dir}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
