import ExpoModulesCore

private let appGroupIdentifier = "group.com.zach.patchfund"

public class AllowanceIntentsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AllowanceIntents")

    Function("getSharedString") { (key: String) -> String? in
      UserDefaults(suiteName: appGroupIdentifier)?.string(forKey: key)
    }

    Function("setSharedString") { (key: String, value: String?) in
      let defaults = UserDefaults(suiteName: appGroupIdentifier)
      if let value {
        defaults?.set(value, forKey: key)
      } else {
        defaults?.removeObject(forKey: key)
      }
      defaults?.synchronize()
    }

    Function("syncChildrenJson") { (json: String) in
      let defaults = UserDefaults(suiteName: appGroupIdentifier)
      defaults?.set(json, forKey: "children_json")
      defaults?.synchronize()
    }
  }
}
