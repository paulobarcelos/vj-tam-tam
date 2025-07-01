# Target Audience / Users

The primary target audience for VJ Tam Tam includes:

1.  **Party Hosts and Event Organizers:** Individuals throwing house parties, small gatherings, or niche events (like the "Bum Bum Tam Tam" parties) who want to easily add a dynamic visual element using their personal media without needing complex, professional VJ software or manual content management during an event. Their key need is a reliable, low-effort, and engaging visual backdrop.
2.  **Casual Users:** Anyone organizing informal social events (birthdays, dinners, casual hangouts) at home or a private space who wants a unique visual atmosphere that uses their own photos and videos in a fresh, non-traditional way, distinct from a standard photo slideshow. Their need is for simplicity, speed, and zero technical barrier to entry.
3.  **DIY Venues and Creative Spaces:** Small clubs, galleries, or community spaces that occasionally need simple, customizable visuals for events, art installations, or background ambiance, and appreciate having basic projection correction tools available for non-ideal setups, but without the cost or complexity of professional AV equipment.

These users value ease of use, quick results, and a tool that enhances the atmosphere without demanding constant attention. They are typically comfortable using a web browser on a desktop or laptop connected to a display or projector.

**Key User Interactions & Flows:**

- **Initial Setup:** User visits URL, drops media files/folders or uses file picker. Playback begins automatically.
- **Persistence & Resumption:** User can close and later revisit the URL; the application state (selected media - if API allows, text entries, settings) will automatically reload from `localStorage`, and playback will resume where they left off.
- **Mid-Performance Updates:** Users can add more media or modify text entries _while playback is ongoing_. The system should integrate these changes dynamically into the current pool for randomization.
- **Mid-Performance Adjustments:** Users can access the advanced settings and projection tools _while playback is ongoing_ to make adjustments (e.g., warp perspective, tweak colors) without interrupting the visual stream.
- **Idle State:** When idle, the UI controls fade away, leaving only the fullscreen visuals. Controls reappear on mouse movement or keypress.

**UI/Visual Approach:**

- **Minimalist Overlay:** A translucent overlay will house controls, appearing only when the user is not idle. This keeps the focus on the visuals.
- **"About" Information:** A small, unobtrusive text element will be present on the UI (likely in the control overlay) indicating authorship and referencing the "Bum Bum Tam Tam" origin.

**Error Handling:**

- In case of non-critical errors (e.g., failure to load a specific file, invalid user input in a setting), a small, non-intrusive, custom-coded **toast notification** will appear briefly to inform the user, and the application will attempt to continue operation without interruption. Critical errors should be logged to the console as noted in technical preferences.
