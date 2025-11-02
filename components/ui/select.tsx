"use client"

import * as React from "react"
import ReactSelect, { components } from "react-select"
import type { MenuListProps } from "react-select"
import { cn } from "@/lib/utils"

// Special value to represent "None" or empty selection
export const NONE_VALUE = "__none__"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  options?: SelectOption[]
  disabled?: boolean
  className?: string
  id?: string
  "aria-invalid"?: boolean
  children?: React.ReactNode
  size?: "sm" | "default"
  footerButton?: React.ReactNode
}

// Helper to extract options from children (backward compatibility)
function extractOptionsFromChildren(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = []
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === SelectContent) {
        const contentProps = child.props as { children?: React.ReactNode }
        React.Children.forEach(contentProps.children, (item) => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            const itemProps = item.props as { value: string; children: React.ReactNode }
            const itemValue = itemProps.value
            const itemLabel = typeof itemProps.children === 'string' 
              ? itemProps.children 
              : React.Children.toArray(itemProps.children).filter(Boolean).join('')
            
            if (itemValue === "") {
              options.push({ value: NONE_VALUE, label: itemLabel || "None" })
            } else {
              options.push({ value: itemValue, label: itemLabel })
            }
          }
        })
      } else if (child.type === SelectItem) {
        const itemProps = child.props as { value: string; children: React.ReactNode }
        const itemValue = itemProps.value
        const itemLabel = typeof itemProps.children === 'string' 
          ? itemProps.children 
          : React.Children.toArray(itemProps.children).filter(Boolean).join('')
        
        if (itemValue === "") {
          options.push({ value: NONE_VALUE, label: itemLabel || "None" })
        } else {
          options.push({ value: itemValue, label: itemLabel })
        }
      }
    }
  })
  
  return options
}

// Main Select component
function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select...",
  options: providedOptions,
  disabled = false,
  className,
  id,
  "aria-invalid": ariaInvalid,
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  size = "default",
  footerButton,
  ...props
}: SelectProps & Omit<React.ComponentProps<typeof ReactSelect>, "options" | "value" | "onChange">) {
  const options = React.useMemo(() => {
    if (providedOptions && providedOptions.length > 0) {
      return providedOptions
    }
    if (children) {
      return extractOptionsFromChildren(children)
    }
    return []
  }, [providedOptions, children])

  const currentValue = value ?? defaultValue ?? ""
  
  const selectedOption = React.useMemo(() => {
    if (currentValue === "") {
      const noneOption = options.find(opt => opt.value === NONE_VALUE)
      return noneOption || null
    }
    if (currentValue === NONE_VALUE) {
      return options.find(opt => opt.value === NONE_VALUE) || null
    }
    return options.find(opt => opt.value === currentValue) || null
  }, [currentValue, options])

  const handleChange = (selected: SelectOption | null) => {
    if (!onValueChange) return
    
    if (selected === null || selected.value === NONE_VALUE) {
      onValueChange(undefined)
    } else {
      onValueChange(selected.value)
    }
  }

  // Extract placeholder from SelectValue if children are provided
  const finalPlaceholder = React.useMemo(() => {
    if (placeholder !== "Select...") return placeholder
    if (!children) return placeholder
    
    let foundPlaceholder = placeholder
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectTrigger) {
        const triggerProps = child.props as { children?: React.ReactNode }
        React.Children.forEach(triggerProps.children, (val) => {
          if (React.isValidElement(val) && val.type === SelectValue) {
            const valueProps = val.props as { placeholder?: string }
            if (valueProps.placeholder) {
              foundPlaceholder = valueProps.placeholder
            }
          }
        })
      }
    })
    return foundPlaceholder
  }, [placeholder, children])

  // Custom MenuList component with footer button support
  const MenuList = (menuListProps: MenuListProps<SelectOption, false>) => {
    return (
      <components.MenuList {...menuListProps}>
        {menuListProps.children}
        {footerButton && (
          <div className="border-t border-border p-1 bg-popover">
            {footerButton}
          </div>
        )}
      </components.MenuList>
    )
  }

  // Inject styles once on mount with computed CSS variable values
  React.useEffect(() => {
    const styleId = 'react-select-styles'
    if (document.getElementById(styleId)) return

    // Get computed CSS variable values
    const root = document.documentElement
    const getComputedVar = (varName: string) => {
      return getComputedStyle(root).getPropertyValue(varName).trim()
    }

    const popoverBg = getComputedVar('--popover') || 'oklch(1 0 0)'
    const borderColor = getComputedVar('--border') || 'oklch(0.922 0 0)'
    const accentBg = getComputedVar('--accent') || 'oklch(0.97 0 0)'
    const accentFg = getComputedVar('--accent-foreground') || 'oklch(0.205 0 0)'

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .react-select__menu {
        background-color: ${popoverBg} !important;
        border: 1px solid ${borderColor} !important;
        border-radius: 0.375rem !important;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        z-index: 9999 !important;
        margin-top: 0.25rem !important;
        opacity: 1 !important;
      }
      .react-select__menu-list {
        background-color: ${popoverBg} !important;
        padding: 0.25rem !important;
        max-height: 300px !important;
        opacity: 1 !important;
      }
      .react-select__option {
        background-color: ${popoverBg} !important;
        opacity: 1 !important;
      }
      .react-select__option--is-focused {
        background-color: ${accentBg} !important;
        color: ${accentFg} !important;
        opacity: 1 !important;
      }
      .react-select__option--is-selected {
        background-color: ${accentBg} !important;
        opacity: 0.7 !important;
      }
      .react-select__option:active {
        background-color: ${accentBg} !important;
        opacity: 1 !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return (
    <ReactSelect<SelectOption>
      id={id}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      placeholder={finalPlaceholder}
      isDisabled={disabled}
      isSearchable={true}
      isClearable={false}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="absolute"
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      components={footerButton ? { MenuList } : undefined}
      aria-invalid={ariaInvalid}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    />
  )
}

// Compatibility components for backward compatibility
function SelectContent({ 
  children
}: { 
  children?: React.ReactNode
  className?: string
  position?: "popper" | "item-aligned"
  align?: "start" | "center" | "end"
}) {
  return <>{children}</>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectItem(_: { 
  value: string
  children: React.ReactNode
  className?: string
}) {
  return null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectTrigger(_: { 
  children?: React.ReactNode
  className?: string
  size?: "sm" | "default"
  id?: string
}) {
  return null
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectValue(_: { 
  placeholder?: string
}) {
  return null
}

function SelectGroup({ 
  children
}: { 
  children?: React.ReactNode
}) {
  return <>{children}</>
}

function SelectLabel({ 
  className, 
  children
}: { 
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}>
      {children}
    </div>
  )
}

function SelectSeparator({ 
  className
}: { 
  className?: string
}) {
  return (
    <div 
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)} 
    />
  )
}

function SelectScrollUpButton() {
  return null
}

function SelectScrollDownButton() {
  return null
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
