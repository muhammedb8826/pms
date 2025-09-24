"use client";

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built with ❤️ by{" "}
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-4"
              >
                Muhdev Inc.
              </a>
              . All rights reserved {currentYear}.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Clinic Stock Management System</span>
            <span className="mx-2">|</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
