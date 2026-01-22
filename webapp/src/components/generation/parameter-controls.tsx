"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParameterControlsProps {
  maxWords: number;
  temperature: number;
  model: string;
  onMaxWordsChange: (value: number) => void;
  onTemperatureChange: (value: number) => void;
  onModelChange: (value: string) => void;
}

export function ParameterControls({
  maxWords,
  temperature,
  model,
  onMaxWordsChange,
  onTemperatureChange,
  onModelChange,
}: ParameterControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Max Words</Label>
          <span className="text-sm text-muted-foreground">{maxWords}</span>
        </div>
        <Slider
          value={[maxWords]}
          onValueChange={(values) => onMaxWordsChange(values[0])}
          min={100}
          max={5000}
          step={100}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of words to generate
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Temperature</Label>
          <span className="text-sm text-muted-foreground">
            {temperature.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[temperature * 100]}
          onValueChange={(values) => onTemperatureChange(values[0] / 100)}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Higher values = more creative, lower values = more focused
        </p>
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            <SelectItem value="claude-3">Claude 3</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the AI model for generation
        </p>
      </div>
    </div>
  );
}
