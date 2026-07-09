import ExpoModulesCore
import Intents
import UIKit

private let appGroupIdentifier = "group.com.zach.patchfund"

private func mapSiriAuthorizationStatus(_ status: INSiriAuthorizationStatus) -> String {
  switch status {
  case .authorized:
    return "authorized"
  case .denied:
    return "denied"
  case .restricted:
    return "restricted"
  case .notDetermined:
    return "notDetermined"
  @unknown default:
    return "notDetermined"
  }
}

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

    AsyncFunction("getSiriAuthorizationStatus") { () -> String in
      mapSiriAuthorizationStatus(INPreferences.siriAuthorizationStatus())
    }

    AsyncFunction("requestSiriAuthorization") { () -> String in
      await withCheckedContinuation { continuation in
        INPreferences.requestSiriAuthorization { status in
          continuation.resume(returning: mapSiriAuthorizationStatus(status))
        }
      }
    }

    Function("openAppSettings") {
      guard let url = URL(string: UIApplication.openSettingsURLString) else { return }
      DispatchQueue.main.async {
        UIApplication.shared.open(url)
      }
    }
  }
}
