# Epic 2: Randomized Segment Playback

_Goal: Enhance the playback engine to handle random segments (configurable duration, e.g., default 5s, range 1-30s) of media files, including skipping parts of videos, providing the "eternal slideshow" effect._

1.  **Story:** As the Application, I want to select a random segment from the currently chosen media item (image or video) for display so that the playback is constantly varied and unpredictable.
    - **AC 1.1:** Given playback is active, when a new media item is selected for display, the application determines a random start point within the media's total duration.
    - **AC 1.2:** The random start point is calculated such that a segment of the configured duration can be played without exceeding the media's total duration.
    - **AC 1.3:** The calculated segment duration for display is a random value between the configured minimum and maximum duration settings (with the configurable minimum and maximum duration settings initially defaulting to 5 seconds each, and the overall configurable range for these settings being 1 to 30 seconds).
    - **AC 1.4:** Given an image is selected, the application displays the full image for the calculated random segment duration.
    - **AC 1.5:** Given a video is selected, the application starts playback of the video from the random start point for the calculated random segment duration.
    - **AC 1.6 (Video Offset Edge Case - Calculate Valid Range):** Given a video with total duration `D`, configured "skip start" `SS`, configured "skip end" `SE`, and selected segment duration `SD` (where `min_duration <= SD <= max_duration`), the application determines the valid range of possible start points `[ValidStartMin, ValidStartMax]` for the segment. This range is initially constrained by `SS` (segment must start >= `SS`) and `D - SE - SD` (segment must end <= `D - SE`).
    - **AC 1.7 (Video Offset Edge Case - Fallback Logic):** If the initially calculated valid range `[ValidStartMin, ValidStartMax]` results in `ValidStartMin > ValidStartMax` (meaning no valid start point exists considering all offsets and duration), the application attempts the following fallback steps until a valid range is found:
      - **Fallback 1:** Recalculate the range ignoring the "skip end" (`SE`) constraint.
      - **Fallback 2:** If Fallback 1 still results in `ValidStartMin > ValidStartMax`, recalculate the range ignoring _both_ the "skip start" (`SS`) and "skip end" (`SE`) constraints.
    - **AC 1.8 (Video Offset Edge Case - Selection):** Once a valid range `[ValidStartMin, ValidStartMax]` is found (either through the initial calculation or a fallback step), the application selects a random start point for the video segment within this valid range.
    - **AC 1.9 (Video Offset Edge Case - Notification):** If Fallback 2 is triggered (meaning both start and end offsets had to be ignored for this specific video), a toast notification appears informing the user that the configured video offsets were too large for a particular video and were temporarily ignored for that playback.
2.  **Story:** As the Application, when displaying a video segment, I want to ensure it plays correctly for its specified duration starting from the randomly selected point so that video playback is consistent with images.
    - **AC 2.1:** Given a video is selected for playback at a specific random start point and for a specific segment duration, the video element's playback begins precisely at the calculated start point.
    - **AC 2.2:** The video playback continues from the start point for the exact duration specified for the segment.
    - **AC 2.3:** When the video playback reaches the end of the segment duration, the application immediately (hard cut) transitions to the next media item.
    - **AC 2.4:** If the video's natural end is reached before the segment duration is complete, the application immediately transitions to the next media item when the video ends.
3.  **Story:** As a User, I want to be able to configure the duration range (minimum and maximum seconds) for the random segments so that I can control the pace of the visual transitions.
    - **AC 3.1:** Given the UI is visible, there is a control (e.g., a slider or input field pair) labeled clearly for setting the minimum segment duration.
    - **AC 3.2:** Given the UI is visible, there is a control (e.g., a slider or input field pair) labeled clearly for setting the maximum segment duration.
    - **AC E2.S3.2a (Min Slider Range & Default):** The minimum segment duration control (slider/input) allows selection from 1 second to 30 seconds, and its initial default value upon first load (before any user configuration is saved) is 5 seconds.
    - **AC E2.S3.2b (Max Slider Range & Default):** The maximum segment duration control (slider/input) allows selection from 1 second to 30 seconds, and its initial default value upon first load (before any user configuration is saved) is 5 seconds.
    - **AC 3.3:** When the user adjusts the minimum duration control, the application updates the setting for subsequent segment duration calculations.
    - **AC 3.4:** When the user adjusts the maximum duration control, the application updates the setting for subsequent segment duration calculations.
    - **AC 3.5:** The application enforces the relationship between minimum and maximum duration: If the user attempts to set a minimum duration greater than the current maximum duration, the maximum duration is automatically increased to equal the new minimum. If the user attempts to set a maximum duration less than the current minimum duration, the minimum duration is automatically decreased to equal the new maximum. No toast notification is displayed for these adjustments.
    - **AC 3.6:** The application uses the currently configured minimum and maximum duration settings when calculating the random segment duration for each new media item.
4.  **Story:** As a User with advanced needs, I want to specify how many seconds to skip from the beginning of video files when selecting a random segment start point so that I can avoid intros or static starts.
    - **AC 4.1:** Given the advanced UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the "skip start" duration for videos.
    - **AC 4.2:** When the user adjusts the "skip start" control, the application updates this setting for subsequent video segment calculations (as used in AC 1.6).
5.  **Story:** As a User with advanced needs, I want to specify how many seconds to skip from the end of video files when selecting a random segment start point so that I can avoid outros or final static frames.
    - **AC 5.1:** Given the advanced UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the "skip end" duration for videos.
    - **AC 5.2:** When the user adjusts the "skip end" control, the application updates this setting for subsequent video segment calculations (as used in AC 1.6).
