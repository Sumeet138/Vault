import clsx from "clsx";
import { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cnm = (...values: ClassValue[]) => twMerge(clsx(values));
