# Auto-Labeling Video for Trucking & Fleet Management

This project outlines a methodology for completely unsupervised segmentation and labeling of video data within the trucking industry. The system leverages a stack of modern AI models to automatically identify and tag in-cab driver behavior, vehicle surroundings, and logistics operations, aiming to enhance safety, compliance, and operational efficiency.

## **Result**

Completely unsupervised segmentation and labeling of in-cab driver behavior, vehicle surroundings, and loading/unloading operations.

The system automatically identifies and tags events and objects relevant to commercial trucking, such as driver drowsiness, nearby road hazards, and proper cargo handling, without requiring manual human intervention.

## **Method: An Adapted Step-by-Step Process**

The core technical stack remains the same, but the context and vocabulary are tailored to trucking. The system processes video from inward-facing (driver), outward-facing (road), and trailer-mounted cameras.

### **(1) LLM Drafts the Scene Narrative**

> **Instead of:** "A worker is assembling a valve..."

> **It becomes:** "A driver is operating a semi-truck on a three-lane highway in rainy conditions. A vehicle is merging into the right lane." or "A forklift is loading a pallet into the trailer at a loading dock."

### **(2) LLM Proposes Label Vocabularies**

> **Instead of:** `part`, `tool`, `worker's hands`...

> **It proposes:**
>
> * **Driver Monitoring:** `hands on wheel`, `eyes on road`, `cell phone use`, `drowsiness`, `seatbelt fastened`.
>
> * **Road Environment:** `car`, `truck`, `motorcycle`, `pedestrian`, `traffic light`, `stop sign`, `lane markings`, `road debris`.
>
> * **Logistics:** `forklift`, `pallet`, `loading dock`, `trailer door`, `personnel`.

### **(3) Grounding DINO Supplies Bounding Boxes**

This step is identical. DINO takes the proposed labels (e.g., "cell phone use," "lane markings") and draws bounding boxes around all potential matches in the video frame.

### **(4) LLM Filters Boxes**

The LLM uses the scene narrative to add context and discard irrelevant boxes. If the narrative is "driver is making a right turn," it prioritizes boxes around the steering wheel, turn signals, and side mirrors over a box around a coffee cup in the cupholder.

### **(5) SAM2 Propagates High-Confidence Masklets**

This step is identical. Once an object is identified with high confidence (e.g., "this is the driver's hand holding a phone"), SAM2 creates a precise pixel-level mask and tracks it through subsequent frames to analyze the duration of the event.

### **(6) Distilled YOLO Runs at the Edge**

The fully labeled video data is used to train a highly efficient, compact model (YOLO). This model is then deployed on an in-cab edge device. It can now identify these pre-learned events in real-time to provide immediate alerts (e.g., a "distracted driving" warning) without needing to send video to the cloud.

## **Technology Stack**

The technology stack is application-agnostic and remains unchanged:

**DINO · SAM-2 · Gemini · YOLO.**

## **Primary Use Cases for Trucking**

* **Driver Safety & Training:** Automatically flag instances of distracted driving, fatigue, or failure to wear a seatbelt to provide real-time alerts and create coaching opportunities.

* **Incident Reconstruction:** Provide objective, detailed data in the event of an accident, showing road conditions, driver actions, and the behavior of other vehicles.

* **Automated Compliance:** Monitor Hours of Service (HOS) and ensure adherence to safety protocols during vehicle operation and at depots.

* **Logistics Efficiency:** Analyze loading and unloading procedures to identify bottlenecks, ensure proper handling of goods, and verify cargo.
