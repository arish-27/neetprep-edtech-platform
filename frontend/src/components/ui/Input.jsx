import React, { forwardRef } from "react";
import { cn } from "@/lib/cn";
export const Input = forwardRef(function Input({ className, ...props }, ref) {
    return (<input ref={ref} className={cn("input-light h-10", className)} {...props}/>);
});
