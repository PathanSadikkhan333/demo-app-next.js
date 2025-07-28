"use client";
import * as React from "react";
import {MoonIcon,SunIcon}from "lucide-react";
import { useTheme, UseThemeProps } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ModeToggle(){
    const {theme,setTheme}=useTheme();
    return(
        <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark"?"light":"dark")}>
        <SunIcon className="h-[1.2rem] w-[1.2rem]rotate-0 scale-100 transitation-all dark:-rotate-90 dark:scale-0"/>
        <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
        <span className="sr-only">Toogle theme</span>
        </Button>
    )
}
