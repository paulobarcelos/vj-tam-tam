### Epic 4: Text Overlay Experience

_Goal: Implement the text input, pool management, and random display logic, allowing users to add and see their custom messages over the visuals._

1.  **Story:** As a User, I want to be able to enter custom text strings one by one so that I can build a pool of messages to display.
    - **AC 1.1:** Given the UI is visible, there is a clearly labeled input field where the user can type text.
    - **AC 1.2:** Given the UI is visible, there is a button (e.g., "Add Text" or "+") next to the input field, or hitting the "Enter" key while focused on the input field, triggers the action to add the entered text.
    - **AC 1.3:** When the user enters text into the input field and triggers the add action, the text string is processed by the application.
    - **AC 1.4:** If the input field is empty when the add action is triggered, no text is added to the pool.
2.  **Story:** As the Application, I want to add newly entered text strings to a pool of text entries, rather than replacing them, so that users can build their collection of messages incrementally.
    - **AC 2.1:** Given the text pool is empty, when the user adds a valid text string, the text pool is populated with that string.
    - **AC 2.2:** Given the text pool already contains entries, when the user adds a new valid text string, the new string is added to the existing text pool. The previously added entries remain in the pool.
    - **AC 2.3:** Given the text pool has been updated by adding new strings, when text display is active, the new strings become eligible for random selection and display alongside the older ones.
3.  **Story:** As a User, I want to see a list of the text strings I have added so that I can review my current pool of messages.
    - **AC 3.1:** Given the UI is visible and the text pool is not empty, there is a visible list or display area showing all the current text strings in the pool.
    - **AC 3.2:** When text strings are added to the pool (via input), the displayed list updates automatically to include the new entries.
    - **AC 3.3:** When text strings are removed from the pool, the displayed list updates automatically to reflect the changes.
    - **AC 3.4:** If the text pool is empty, the list/display area for text strings is empty or hidden.
4.  **Story:** As a User, I want to be able to remove individual text strings from the list so that I can manage my pool of messages.
    - **AC 4.1:** Given the list of text strings is displayed, each individual text string in the list has a clearly identifiable control (e.g., an "X" button) to trigger its removal.
    - **AC 4.2:** When the user activates the removal control for a specific text string, that string is removed from the text pool.
    - **AC 4.3:** Removing a text string updates the displayed list (as per AC 4.3.3).
5.  **Story:** As a User, I want to be able to clear the entire list of text strings so that I can start my message pool over.
    - **AC 5.1:** Given the UI is visible and the text pool is not empty, there is a clearly labeled control (e.g., a "Clear All" button) to remove all text entries.
    - **AC 5.2:** When the user activates the "Clear All" control, the text pool becomes empty.
    - **AC 5.3:** Clearing all text strings updates the displayed list to be empty (as per AC 3.4).
6.  **Story:** As the Application, I want to randomly select a text string from the pool and display it on the screen periodically during playback so that custom messages appear over the visuals.
    - **AC 6.1:** Given playback is active and the text pool is not empty, the application periodically selects a random text string from the pool for display.
    - **AC 6.2:** The selection and display of text strings occur independently of the media segment transitions.
    - **AC 6.3:** When a text string is selected, it is displayed on the screen for a specific duration (e.g., 3-5 seconds).
    - **AC 6.4:** After the display duration, the text string fades out or is immediately hidden.
    - **AC 6.5:** The frequency with which new text strings are selected and displayed is controllable (see Story 7).
7.  **Story:** As a User, I want to be able to configure how frequently text strings appear on the screen so that I can control the balance between visuals and messages.
    - **AC 7.1:** Given the UI is visible, there is a control (e.g., a slider or input field) labeled clearly for setting the frequency or probability of text display (e.g., a value from 0 to 1, or "Rare", "Occasional", "Frequent").
    - **AC 7.2:** When the user adjusts the text frequency control, the application updates this setting.
    - **AC 7.3:** The application uses the current text frequency setting to determine how often new text strings are selected and displayed (AC 6.5). A frequency of 0 should result in no text being displayed.
8.  **Story:** As the Application, I want the displayed text strings to be styled with a bold Arial font, be centered on the screen, and scale dynamically to occupy a maximum of 80% of the screen's width or height so that they are prominent and readable.
    - **AC 8.1:** Given a text string is selected for display, it is rendered using a bold weight of the Arial font family.
    - **AC 8.2:** Given a text string is displayed, its HTML element is positioned using CSS so that it is visually centered horizontally within the display area.
    - **AC 8.3:** Given a text string is displayed, its HTML element is positioned using CSS so that it is visually centered vertically within the display area.
    - **AC 8.4:** Given a text string is displayed, its font size is dynamically calculated based on the current browser window dimensions and the text content, such that the text bounding box does not exceed 80% of either the screen width or the screen height.
    - **AC 8.5:** Given a text string is displayed, its color is randomly chosen to be either pure black (`#000000`) or pure white (`#FFFFFF`). A different random color choice is made each time a text string is selected for display.
    - **AC 8.6:** Given a text string is displayed, its HTML element has a CSS `z-index` value or stacking context that ensures it appears visually _on top of_ the media elements (`<img>` or `<video>`) displayed on the stage.
