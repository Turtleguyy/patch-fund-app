import AppIntents

@available(iOS 16.0, *)
struct AllowanceShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: AddDollarIntent(),
      phrases: [
        "Add a dollar in \(.applicationName)",
        "Add a dollar with \(.applicationName)",
        "Add a dollar to \(.applicationName)",
        "Add a dollar to the \(.applicationName)",
      ],
      shortTitle: "Add a Dollar",
      systemImageName: "plus.circle"
    )
    AppShortcut(
      intent: TakeDollarIntent(),
      phrases: [
        "Take a dollar in \(.applicationName)",
        "Take a dollar with \(.applicationName)",
        "Take a dollar from \(.applicationName)",
        "Take a dollar from the \(.applicationName)",
      ],
      shortTitle: "Take a Dollar",
      systemImageName: "minus.circle"
    )
  }
}
