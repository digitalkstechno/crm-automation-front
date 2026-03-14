import { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    required?: boolean;
}

const Label = ({ children,required, ...props }: LabelProps) => {
    return (
        <label className="block text-sm font-medium text-slate-700 mb-1" {...props}>
            {children}
            <span className="text-red-500 ml-1">{required ? "*" : ""}</span>
        </label>
    );
};

export default Label;