import AppKit
import Foundation

// AppKit exposes the camera housing's safe areas; Electron only exposes the menu-bar work area.
var displays: [[String: Any]] = []
for screen in NSScreen.screens {
    let displayID = (screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? NSNumber)?.uint32Value ?? 0
    var width: CGFloat = 0
    let height = screen.safeAreaInsets.top
    if height > 0, let left = screen.auxiliaryTopLeftArea, let right = screen.auxiliaryTopRightArea {
        width = max(0, screen.frame.width - left.width - right.width)
    }
    displays.append(["id": displayID, "width": Double(width), "height": Double(height)])
}
let data = try JSONSerialization.data(withJSONObject: displays, options: [.sortedKeys])
FileHandle.standardOutput.write(data)
