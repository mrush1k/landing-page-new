// Script to analyze UI component usage
const fs = require('fs');
const path = require('path');

// All UI components in the ui folder
const allUIComponents = [
  'accordion', 'alert-dialog', 'alert', 'aspect-ratio', 'avatar', 'badge', 'breadcrumb', 'button', 
  'calendar', 'card', 'carousel', 'chart', 'checkbox', 'collapsible', 'command', 'context-menu', 
  'date-input', 'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card', 'icons', 'input-otp', 
  'input', 'label', 'menubar', 'navigation-menu', 'pagination', 'popover', 'progress', 'radio-group', 
  'resizable', 'scroll-area', 'select', 'separator', 'sheet', 'skeleton', 'slider', 'sonner', 
  'switch', 'table', 'tabs', 'textarea', 'toast', 'toaster', 'toggle-group', 'toggle', 'tooltip'
];

// Parse the findstr output from stdin and extract used components
const usedComponents = new Set();

// Sample imports to analyze (this would normally come from stdin)
const sampleImports = `
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Toaster } from '@/components/ui/toaster'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { toggleVariants } from '@/components/ui/toggle'
import type { ToastActionElement, ToastProps } from '@/components/ui/toast'
import type { CalendarProps } from '@/components/ui/calendar'
`;

// Extract used components from import statements
const importRegex = /from ['"]@\/components\/ui\/([^'"]*)['"]/g;
let match;
while ((match = importRegex.exec(sampleImports)) !== null) {
  usedComponents.add(match[1]);
}

console.log('=== UI COMPONENT USAGE ANALYSIS ===\n');

console.log('USED COMPONENTS (' + usedComponents.size + '):');
Array.from(usedComponents).sort().forEach(component => {
  console.log('✅ ' + component);
});

console.log('\nUNUSED COMPONENTS (' + (allUIComponents.length - usedComponents.size) + '):');
const unusedComponents = allUIComponents.filter(component => !usedComponents.has(component));
unusedComponents.sort().forEach(component => {
  console.log('❌ ' + component);
});

console.log('\n=== SUMMARY ===');
console.log('Total UI components:', allUIComponents.length);
console.log('Used components:', usedComponents.size);
console.log('Unused components:', unusedComponents.length);
console.log('Usage percentage:', Math.round((usedComponents.size / allUIComponents.length) * 100) + '%');

console.log('\n=== UNUSED COMPONENTS TO DELETE ===');
unusedComponents.forEach(component => {
  console.log(`components/ui/${component}.tsx`);
});