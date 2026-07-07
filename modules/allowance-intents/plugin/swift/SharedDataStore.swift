import Foundation

enum SharedDataStore {
  static let appGroupIdentifier = "__APP_GROUP__"
  static let pendingSiriTextKey = "pending_siri_text"
  static let childrenJsonKey = "children_json"
  static let siriDeepLink = "__SIRI_DEEP_LINK__"

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  static func setPendingSiriText(_ text: String) {
    defaults?.set(text, forKey: pendingSiriTextKey)
    defaults?.synchronize()
  }
}
