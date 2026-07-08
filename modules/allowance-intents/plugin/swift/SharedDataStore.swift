import Foundation

enum SharedDataStore {
  static let appGroupIdentifier = "__APP_GROUP__"
  static let pendingSiriTextKey = "pending_siri_text"
  static let childrenJsonKey = "children_json"
  static let selectedChildIdKey = "selected_child_id"
  static let siriDeepLink = "__SIRI_DEEP_LINK__"

  struct StoredChild: Codable, Hashable {
    let id: String
    let name: String
  }

  static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupIdentifier)
  }

  static func setPendingSiriText(_ text: String) {
    defaults?.set(text, forKey: pendingSiriTextKey)
    defaults?.synchronize()
  }

  static func loadChildren() -> [StoredChild] {
    guard let json = defaults?.string(forKey: childrenJsonKey),
          let data = json.data(using: .utf8),
          let children = try? JSONDecoder().decode([StoredChild].self, from: data)
    else {
      return []
    }
    return children
  }

  static func selectedChildId() -> String? {
    defaults?.string(forKey: selectedChildIdKey)
  }
}
