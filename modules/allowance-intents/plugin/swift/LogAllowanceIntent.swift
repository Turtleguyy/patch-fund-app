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

@available(iOS 16.0, *)
struct AddDollarIntent: AppIntent {
  static var title: LocalizedStringResource = "Add a Dollar"
  static var description = IntentDescription("Add one dollar to a child's allowance.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    .result(dialog: await AllowanceIntentSupport.openApp(with: "add a dollar"))
  }
}

@available(iOS 16.0, *)
struct TakeDollarIntent: AppIntent {
  static var title: LocalizedStringResource = "Take a Dollar"
  static var description = IntentDescription("Take one dollar from a child's allowance.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult & ProvidesDialog {
    .result(dialog: await AllowanceIntentSupport.openApp(with: "take a dollar"))
  }
}
