/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Search, Upload, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search books..." className="pl-9" />
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          {/* @ts-expect-error */}
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import books</TooltipContent>
        </Tooltip>

        <Tooltip>
          {/* @ts-expect-error */}
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <Avatar className="h-8 w-8">
          <AvatarFallback>T</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
