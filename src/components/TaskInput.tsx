"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Play } from "lucide-react";

interface TaskInputProps {
  onSubmit: (description: string) => void;
  isLoading: boolean;
}

export function TaskInput({ onSubmit, isLoading }: TaskInputProps) {
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isLoading) return;
    onSubmit(description.trim());
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what you want to build..."
        className="flex-1"
        disabled={isLoading}
      />
      <Button type="submit" disabled={!description.trim() || isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" />
            Running
          </>
        ) : (
          <>
            <Play className="size-4" />
            Run
          </>
        )}
      </Button>
    </form>
  );
}
