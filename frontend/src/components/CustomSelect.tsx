import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[] | { label: string; value: string }[];
    label?: string;
    placeholder?: string;
    className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select an option',
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );

    const selectedOption = normalizedOptions.find(opt => opt.value === value);

    const updateCoords = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, true);
        }
        return () => {
            window.removeEventListener('resize', updateCoords);
            window.removeEventListener('scroll', updateCoords, true);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
            const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);

            if (isOutsideContainer && isOutsideMenu) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownMenu = (
        <div
            ref={menuRef}
            className="fixed bg-[#09090b] border border-zinc-800 rounded-md shadow-lg py-1 z-[9999] animate-dropdown ring-1 ring-black/10"
            style={{
                top: `${coords.top + 4}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`
            }}
        >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {normalizedOptions.map((option) => (
                    <div
                        key={option.value}
                        onClick={() => {
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "px-2.5 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors rounded-sm",
                            value === option.value
                                ? "bg-zinc-800 text-white font-medium"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                        )}
                    >
                        <span>{option.label}</span>
                        {value === option.value && <Check size={14} className="text-white" />}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={cn("space-y-1.5 relative", className)} ref={containerRef}>
            {label && <label className="text-xs font-semibold text-zinc-500 uppercase tracking-tight ml-0.5">{label}</label>}

            <div
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-zinc-900/50 border border-zinc-800 rounded-md py-2.5 px-3 outline-none cursor-pointer flex items-center justify-between transition-all duration-200",
                    "hover:border-zinc-700 hover:bg-zinc-900",
                    isOpen && "border-zinc-600 ring-1 ring-zinc-600 bg-zinc-900",
                    !selectedOption && "text-zinc-500"
                )}
            >
                <span className={cn("text-sm", !selectedOption && "text-zinc-500", selectedOption && "text-zinc-200")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn("text-zinc-500 transition-transform duration-200", isOpen && "rotate-180 text-zinc-300")}
                />
            </div>

            {isOpen && createPortal(dropdownMenu, document.body)}
        </div>
    );
};

export default CustomSelect;
