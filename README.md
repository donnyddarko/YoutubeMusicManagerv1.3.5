# YoutubeMusicManagerv1.3.5
A rule-based, autonomous software agent for YouTube Music that automates the progressive selection and controlled deletion of uploaded tracks. Built as a Tampermonkey userscript, it applies deterministic decision-making principles inspired by symbolic AI, prioritizing user control, transparency, and safety.
YoutubeMusicManagerv1.3.5

# Building AI course project - University of Helsinki & Reaktor
Author: Donald Ndreu
Version: 1.3.5
Platform: YouTube Music
Technology: JavaScript / Tampermonkey
Approach: Deterministic rule-based software agent, inspired by symbolic AI

# Summary
A rule-based, autonomous software agent for YouTube Music that automates the progressive selection and controlled deletion of uploaded tracks. Built as a Tampermonkey userscript, it applies deterministic decision-making principles inspired by symbolic AI, prioritizing user control, transparency, and safety.
This project was developed as a practical demonstration of how elementary concepts associated with artificial intelligence, especially rule-based decision-making and autonomous agents, can be applied to solve a real-world problem.
Unlike a conventional theoretical proposal, YouTube Music Manager is an existing, functional software application developed and refined through iterative testing.
The agent supports bulk deletion not only from the Uploads section but also directly from compatible YouTube Music playlists, allowing users to manage specific collections without navigating back to their entire uploaded music library.

# Background
The problem: Do we really control our digital music collections?
Imagine spending years purchasing music CDs, collecting albums, and building a personal music library.
Now imagine discovering that the modern music industry increasingly expects you to access music through subscription-based streaming services, even when you already own physical copies of your favorite albums.
Fortunately, alternative solutions exist.
Users can create local media servers using technologies such as NAS devices and dedicated media management applications. However, these solutions may require technical expertise, financial investment, and ongoing maintenance.
YouTube Music offers another interesting possibility: users can upload their own music files and access them through a cloud-based library without necessarily subscribing to YouTube Music Premium.
The platform supports large personal music collections, making it an attractive option for people who want to maintain access to music they already possess.
However, there is a practical limitation.
Managing thousands of individually uploaded tracks through the standard web interface can become repetitive, inconvenient, and extremely time-consuming.

# Problems addressed
The project focuses on several recurring difficulties:
- Managing large collections containing thousands of uploaded songs.
- Selecting multiple tracks through repetitive interactions.
- Navigating dynamically loaded music lists.
- Removing unwanted uploads without repeating the same manual procedure hundreds or thousands of times.
- Maintaining control over potentially destructive operations.
- Reducing the technical barriers associated with managing large personal music collections.

# Personal motivation
The project originated from a genuine personal requirement.
While organizing a music collection containing more than 200 tracks, I encountered limitations in the standard YouTube Music interface.
Manually selecting and removing large numbers of uploaded songs was neither practical nor efficient.
Instead of accepting these limitations or investing in a completely different infrastructure, I decided to develop a software agent capable of automating the repetitive operations.
The objective was not simply to make the process faster.
It was to create a solution that remained transparent, accessible, predictable, and under the user's control.

# Why this matters
Technological progress should increase individual freedom rather than unnecessarily restrict it.
Users should have meaningful control over their digital collections, regardless of whether those collections are stored locally or through a cloud-based service.
YouTube Music Manager explores how relatively simple computational techniques can improve the usability of an existing platform without requiring expensive infrastructure or advanced technical knowledge from the end user.

# How is it used?
YouTube Music Manager operates directly inside the YouTube Music web interface through Tampermonkey, a browser extension capable of executing custom JavaScript userscripts.
The application introduces a dedicated graphical control panel for managing uploaded music.

# Requirements
- A compatible desktop web browser.
- The Tampermonkey browser extension.
- Access to YouTube Music.
- A personal library containing uploaded music tracks.
- The YouTube Music Manager userscript.
No dedicated server, external database, machine-learning model, or paid AI inference service is required.

# Installation
- Install Tampermonkey in a compatible browser.
- Obtain the YouTube Music Manager JavaScript userscript.
- Import the script into Tampermonkey.
- Enable the script.
- Navigate to https://music.youtube.com/.
- Open the section containing your uploaded music tracks.
- Use the integrated control panel to select the desired operating mode.

Important: The script is designed for managing uploaded music through the browser interface. Its behavior depends on the current structure of YouTube Music and should be verified before performing bulk operations.

# Graphical interface
The software includes a custom graphical user interface designed to remain accessible during library management.
Its characteristics include:
- A floating control panel.
- Adjustable panel positioning through dragging.
- A minimizable interface.
- Transparent visual styling.
- Persistent panel positioning.
- A keyboard shortcut using F8.
- A keyboard shortcut using ENTER.
- Dedicated controls for selecting and deleting tracks.
- Visual indicators identifying the active operating mode.
- Progress information and operational feedback.

The application starts with the Selector mode active.
The inactive mode is visually distinguished from the active one, helping the user understand which operations are currently available.
Switching between operating modes resets the relevant operational state to avoid unintentionally carrying actions from one mode into another.

# Operating mode 1: Selector
The Selector mode automates progressive track selection.
The user manually identifies the starting point within the music library.

Once the selection process begins, the agent:
1. Identifies the relevant track elements in the interface.
2. Locates the controls associated with track selection.
3. Performs selection operations progressively.
4. Updates the number of selected tracks.
5. Handles scrolling as the list progresses.
6. Checks whether the interface remains consistent with the expected state.
7. Stops when instructed or when the required operating conditions are no longer satisfied.

The process can be repeated in multiple sessions, allowing the user to manage a large collection without necessarily processing the entire library in a single operation.
The interface provides start and stop controls, with keyboard-assisted interaction available for the selection workflow.
The purpose is to automate repetitive interactions while preserving the user's ability to determine where the operation begins and when it ends.

# Operating mode 2: Deleter
The Deleter mode performs controlled bulk removal of uploaded music tracks.
Unlike an uncontrolled deletion script, this mode requires the user to define the intended operation.
The workflow consists of:
1. Activating the Deleter mode.
2. Manually identifying the starting track.
3. Specifying the number of tracks to remove.
4. Requesting the operation through the control panel.
5. Reviewing the proposed operation and its preview.
6. Providing explicit confirmation.
7. Allowing the agent to execute the deletion sequence.
8. Monitoring progress and completion feedback.

The application uses browser-interface interactions to perform the deletion operations.
Additional checks help prevent the agent from continuing when the interface behaves unexpectedly.

# Safety mechanisms
Bulk deletion is potentially destructive and must therefore be treated differently from ordinary selection.
The application incorporates several safeguards:
- Explicit user confirmation before deletion.
- A preview stage.
- A user-defined deletion quantity.
- Operational status monitoring.
- Checks against unexpected interface changes.
- Controlled stopping when expected elements cannot be verified.
- State isolation between selection and deletion workflows.

The project prioritizes predictable behavior over blindly completing an operation.
Important: Deleted uploaded tracks may not be recoverable. Users should maintain independent backups of their original music files before executing bulk deletion operations.

# Data sources and AI methods
# Data sources
YouTube Music Manager does not rely on a conventional training dataset.
Instead, it operates on information made available by the YouTube Music web interface during normal browser interaction.
Its primary information source is the Document Object Model (DOM).
The DOM represents the structure of a webpage and makes its elements accessible to JavaScript.
Relevant information includes:
- Music list elements.
- Track selection controls.
- Visible interaction states.
- Dialog windows.
- Confirmation buttons.
- Dynamically generated interface components.
- The current progression of the operation.

This information is interpreted through predefined rules to determine the next action.
The application does not require external training data, a neural network, or a remote AI API.

# AI approach: Deterministic rule-based agents
The architecture is inspired by principles associated with symbolic artificial intelligence and rule-based software agents.
In traditional symbolic AI, behavior can be described through explicit representations, logical conditions, and predefined rules.
For example:
- IF a valid track selection control is available,
- AND the interface is in the expected state,
- THEN perform the next selection operation.

- IF the next expected element cannot be identified,
- THEN stop the operation rather than proceeding blindly.

- IF a deletion operation requires confirmation,
- THEN request authorization before executing it.

These simplified examples illustrate the decision-making principles of the application.

# Agent architecture
Conceptually, the software operates through a repeated cycle:
- Observe → Evaluate → Decide → Act → Verify
- Observe: Inspect the relevant webpage elements and their current states.
- Evaluate: Determine whether the expected operating conditions are satisfied.
- Decide: Select the next permitted action according to predefined rules.
- Act: Execute the corresponding browser interaction.
- Verify: Check whether execution can continue safely.

This architecture allows a sequence of actions to be performed without requiring continuous manual intervention.
However, its autonomy remains restricted to the specific operations, conditions, and decisions implemented by its rules.

# Is this actually artificial intelligence?
This distinction deserves particular attention.
Not every automated script qualifies as an artificial intelligence system simply because it performs tasks without human intervention.
YouTube Music Manager does not contain a trained machine-learning model, a knowledge-based reasoning engine, or an adaptive learning mechanism.
Its behavior is deterministic.
The relationship with AI lies in the conceptual design of a rule-based agent that observes its environment, evaluates predefined conditions, and selects actions accordingly.
These characteristics overlap with foundational concepts taught in classical and symbolic AI.
Nevertheless, the current implementation can also be accurately classified as rule-based browser automation.
The project therefore explores elementary AI-inspired decision-making rather than claiming to implement advanced artificial intelligence.
This distinction is intentional and reflects the importance of accurately communicating both the capabilities and the limitations of a technical solution.

# Why not use machine learning?
Machine learning would introduce additional complexity without necessarily solving the underlying problem more effectively.
The target environment contains structured interface elements that can be inspected programmatically.
The required decisions are relatively limited and can be expressed through explicit conditions.
For this application, a deterministic approach offers several advantages:
- Predictable execution.
- Easier debugging.
- Lower computational requirements.
- No model-training process.
- No external inference infrastructure.
- Greater transparency regarding the actions performed.
- The objective is not to implement the most sophisticated technology available.
- It is to choose an appropriate computational approach for the problem being solved.
- 

# Challenges
Despite its practical advantages, YouTube Music Manager has several limitations.
1. Dependency on YouTube Music
The application interacts with a third-party website.
Changes to the structure of YouTube Music, its DOM elements, its interaction mechanisms, or its user interface may affect compatibility.
Future maintenance may therefore be necessary.
2. Dynamic content and virtualized lists
YouTube Music dynamically loads and manages interface elements.
This behavior introduces difficulties when processing large collections, especially when elements are added, removed, or recycled as the user scrolls.
The software must account for these changes and avoid proceeding when the expected interface state cannot be established.
3. No adaptive learning
The agent cannot automatically learn a new website layout or discover new interaction strategies.
If YouTube Music significantly changes its interface, the predefined rules may require manual modification.
4. Limited generalization
The software is specifically designed for YouTube Music.
It cannot automatically operate on Spotify, Apple Music, or other streaming platforms without additional development.
5. Potentially irreversible operations
Bulk deletion carries inherent risks.
Although the software provides preventive checks and confirmation mechanisms, no automated process can guarantee the complete elimination of operational errors.
Users remain responsible for reviewing the intended actions and preserving backups of their original music collections.
6. Ethical considerations
The project is intended to support legitimate personal management of user-uploaded music.
It does not aim to bypass subscription requirements, digital rights management systems, access restrictions, or copyright protections.
Its purpose is to improve user control over permitted library-management operations.

# What next?
YouTube Music Manager v1.3.5 represents a functional implementation of the original concept.
Several possible developments could improve its reliability, accessibility, and technical capabilities.
Improved interface recognition
Future versions could introduce more advanced mechanisms for recognizing interface elements and responding to changes in the webpage structure.
This could reduce maintenance requirements caused by platform updates.
Adaptive decision-making
A more advanced implementation might explore techniques such as:
- Heuristic-based interface analysis.
- More sophisticated state recognition.
- Dynamic recovery strategies.
- Automated detection of unexpected interface behavior.
- More adaptable action-planning mechanisms.

Such improvements would need to be evaluated against their additional complexity and operational risks.


# Enhanced operational reporting
Future versions could provide more detailed logs, execution summaries, and diagnostic information.
These features would help users understand which actions were completed and why an operation stopped.

# User documentation
Additional documentation could explain practical workflows for preparing, uploading, organizing, and maintaining personal music collections.
The goal would be to make the overall solution more accessible to users with limited technical experience.

# Broader applicability
The underlying principles could potentially be adapted to other web-based applications that require repetitive, structured interactions.
Any such extension would require platform-specific development and appropriate safeguards.

# Long-term vision
The long-term objective is not simply to create a larger automation script.
It is to investigate how lightweight, transparent, user-controlled software agents can make existing digital platforms more accessible and manageable.
Advanced AI is not always necessary to deliver meaningful improvements.
Sometimes the most useful solution is the one that solves a clearly defined problem with the least unnecessary complexity.

# Acknowledgments
This project was developed as part of the learning journey associated with Elements of AI - Building AI, created by the University of Helsinki and Reaktor.
The course provided the theoretical background and inspiration for exploring artificial intelligence concepts through practical problem-solving.

# Technologies and resources
- University of Helsinki & Reaktor: Educational framework provided by the Elements of AI and Building AI courses.
- Tampermonkey: Browser userscript execution and management environment.
- JavaScript: Primary programming language.
- YouTube Music: The web platform whose uploaded-music management interface is used by the application.
- OpenAI ChatGPT: AI-assisted support during iterative development, code refinement, debugging, and technical documentation.

# Development approach
The project originated from a personally identified problem.
Its objectives, operational requirements, interface behavior, safety conditions, and design decisions were defined and progressively refined through practical testing.
AI-assisted development tools were used to support implementation and troubleshooting.
The human developer retained responsibility for specifying the requirements, evaluating the results, validating the behavior, and determining the final implementation.

# Copyright and project status

Author: Donald Ndreu
Project: YouTube Music Manager
Version: 1.3.5
Copyright © 2026 Donald Ndreu. All rights reserved.
This repository is intended to document a personal software project developed in connection with the Building AI course.
Unless a separate license is explicitly provided, no additional permission is granted to reproduce, modify, or redistribute the original source code beyond the permissions applicable under law and GitHub's terms of service.
The project is independent and is not affiliated with, endorsed by, or sponsored by Google, YouTube, or Tampermonkey.
YouTube and YouTube Music are trademarks of their respective owners.

Building AI course project - University of Helsinki & Reaktor.
Developed to explore practical, transparent, rule-based automation and the importance of individual control over digital technology.
