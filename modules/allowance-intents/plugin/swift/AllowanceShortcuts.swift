import AppIntents

struct AllowanceShortcuts: AppShortcutsProvider {
  static var shortcutTileColor: ShortcutTileColor = .pink

  @AppShortcutsBuilder
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogEntryIntent(),
      phrases: [
        "\(.applicationName)",
        "Update \(.applicationName)",
        "Update the \(.applicationName)",
      ],
      shortTitle: "Log Entry",
      systemImageName: "plus.circle"
    )
  }
}
