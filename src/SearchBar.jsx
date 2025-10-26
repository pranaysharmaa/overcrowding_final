import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-gray-300 px-4 py-2"
    >
      {/* Input */}
      <input
        className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-gray-500"
        placeholder="Search city"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Button */}
      <button
        type="submit"
        className="rounded-full bg-black text-white text-sm px-4 py-1.5 active:scale-[.97] transition"
      >
        Search
      </button>
    </form>
  );
}
