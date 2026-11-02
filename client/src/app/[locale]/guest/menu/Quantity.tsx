import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Quantity({ onChange, value }: { onChange: (value: number) => void; value: number }) {
  return (
    <div className='flex gap-1'>
      <Button className='h-6 w-6 p-0' disabled={value === 0} onClick={() => onChange(value - 1)}>
        <Minus className='h-3 w-3' />
      </Button>
      <Input
        type='text'
        inputMode='numeric'
        pattern='[0-9]*'
        className='h-6 w-8 p-1 text-center'
        value={value}
        onChange={(e) => {
          const value = e.target.value;
          const numberValue = Number(value);
          if (isNaN(numberValue)) {
            return;
          }
          if (onChange) {
            onChange(numberValue);
          }
        }}
      />
      <Button className='h-6 w-6 p-0' onClick={() => onChange(value + 1)}>
        <Plus className='h-3 w-3' />
      </Button>
    </div>
  );
}
