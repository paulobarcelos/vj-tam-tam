# Vision & Goals

- **Vision:** To become the go-to, effortless web tool for anyone wanting to add a dynamic, personal, and "eternal" visual backdrop to their social gatherings, empowering them to create a unique atmosphere simply by using their existing media.

- **Primary Goals (MVP):**

  1.  Enable users to instantly initiate an endless, randomized playback of their local photos (JPG/PNG/GIF/HEIC/WebP) and videos (MP4/MOV/WebM/AVI) by simply dropping files or selecting via a file dialog.
  2.  Implement a core playback engine that seamlessly transitions between media segments (with an initial default duration of 5 seconds each, individually configurable from 1 to 30 seconds) using hard cuts, ensuring a continuous and unpredictable visual flow.
  3.  Provide an intuitive text overlay system allowing users to add and display custom messages randomly over the visuals, with configurable frequency and a visually impactful presentation.
  4.  Develop a hidden-by-default "Advanced" mode accessible via a UI toggle, offering essential projection mapping controls (perspective warp, rotate/flip/scale) and basic color correction (brightness, contrast, saturation) for adapting to various projector setups.
  5.  Ensure all user configurations (file selections - if possible via API, text entries, timing settings, advanced display settings (including projection settings like warp/calibration data), video segment controls) are automatically saved and loaded from `localStorage` for persistence across sessions.

- **Success Criteria (Lean & Pragmatic):**
  - Successful and stable playback of diverse media types over extended periods (e.g., several hours) without crashes or significant performance degradation on typical desktop browsers.
  - Positive qualitative feedback from initial users, particularly regarding the ease of use and the unique "eternal slideshow" effect during real-world party scenarios.
  - Evidence of community engagement via GitHub (e.g., creation of issues for bug reports or feature suggestions, potential pull requests), indicating the tool is being used and valued.
  - Minimal or no critical errors reported in the browser console during typical usage flows.
