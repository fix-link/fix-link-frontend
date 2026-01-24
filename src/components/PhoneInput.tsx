import React, { useState, useEffect } from "react";

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

const COUNTRY_CODES = [
    { code: "+251", country: "ET", label: "🇪🇹 +251" },

];

const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, error }) => {
    const [countryCode, setCountryCode] = useState("+251");
    const [phoneNumber, setPhoneNumber] = useState("");

    // Initialize from value if present
    useEffect(() => {
        if (value) {
            // Simple heuristic to split code and number if possible
            // This presumes the value stored is full format: "+251911..."
            const foundCode = COUNTRY_CODES.find((c) => value.startsWith(c.code));
            if (foundCode) {
                setCountryCode(foundCode.code);
                setPhoneNumber(value.replace(foundCode.code, ""));
            } else {
                setPhoneNumber(value);
            }
        }
    }, []);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow only numbers and limit to 9 digits
        const numeric = raw.replace(/\D/g, "").slice(0, 9);
        setPhoneNumber(numeric);
        onChange(`${countryCode}${numeric}`);
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        onChange(`${newCode}${phoneNumber}`);
    };

    return (
        <div className="flex flex-col w-full">
            <div className="relative flex rounded-lg border border-border-color bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                {/* Country Code Dropdown */}
                <div className="flex items-center border-r border-border-color bg-gray-50 dark:bg-gray-700 px-3">
                    <select
                        value={countryCode}
                        onChange={handleCodeChange}
                        className="bg-transparent text-sm font-medium outline-none cursor-pointer text-text-primary dark:text-white"
                    >
                        {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Numeric Input */}
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handleNumberChange}
                    maxLength={9}
                    placeholder="911223344"
                    className="flex-1 w-full px-4 py-3 outline-none bg-transparent text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-gray-400"
                />
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default PhoneInput;
