import "~/styles/globals.css"

export default function AccountLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {children}
    </div>
  )
}