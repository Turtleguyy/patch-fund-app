import AppIntents
import UIKit

enum AllowanceIntentSupport {
  @MainActor
  static func openApp(with spokenText: String) async -> IntentDialog {
    SharedDataStore.setPendingSiriText(spokenText)

    if let url = URL(string: SharedDataStore.siriDeepLink) {
      await UIApplication.shared.open(url)
    }

    return IntentDialog("Opening Patch Fund.")
  }
}

struct LogEntryIntent: AppIntent {
  static var title: LocalizedStringResource = "Log Entry"
  static var description = IntentDescription(
    "Log an allowance entry by voice. Say add or take, the amount, child, and reason."
  )
  static var openAppWhenRun: Bool = true

  @Parameter(
    title: "What to log",
    description: "For example: add five dollars for mowing the lawn"
  )
  var entry: String

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    let text = entry.trimmingCharacters(in: .whitespacesAndNewlines)
    if text.isEmpty {
      throw $entry.needsValueError(
        "Try something like add five dollars for mowing the lawn, or take two dollars from Emma for talking back."
      )
    }
    return .result(dialog: await AllowanceIntentSupport.openApp(with: text))
  }
}
