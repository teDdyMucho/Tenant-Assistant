interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-800 text-center">
          {title}
        </h1>
      </div>
    </header>
  );
}
