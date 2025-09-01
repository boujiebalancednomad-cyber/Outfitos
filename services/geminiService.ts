import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { Outfit, Model, Hairstyle } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper: Convert Base64 string to File object
const base64StringToFile = (base64String: string, filename: string, mimeType: string): File => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
};


// New function to analyze the model image for its features
export const analyzeModel = async (ai: GoogleGenAI, model: Model): Promise<string> => {
    const modelBase64 = await fileToBase64(model.file);
    const modelPart = { inlineData: { data: modelBase64, mimeType: model.file.type } };
    const prompt = "Analyze the person in this image. Provide a highly detailed, factual description covering: face shape, eye color and shape, nose shape, lip shape, skin tone, hair color and style, estimated age, body type, and any unique features like freckles or scars. Describe them as if you were creating a character sheet for a photorealistic digital double. Output text only.";

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [modelPart, { text: prompt }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing model:", error);
        return "A person with features as depicted in the reference image."; // Fallback description
    }
};

// New function to analyze garment images for their details
const analyzeGarments = async (ai: GoogleGenAI, outfit: Outfit): Promise<string> => {
    if (outfit.garments.length === 0) return "No garments provided.";
    const garmentParts = await Promise.all(outfit.garments.map(async (g) => {
        const base64 = await fileToBase64(g.file);
        return { inlineData: { data: base64, mimeType: g.file.type } };
    }));
    const prompt = "Analyze the clothing items, footwear, and accessories in these images. For each item, provide a highly detailed, factual description covering: item type (e.g., t-shirt, jeans, handbag, sneakers), exact color and material (e.g., cotton, denim, leather), texture, silhouette and fit, and any specific details like seams, buttons, zippers, hardware, logos, branding, or graphic patterns. Be extremely precise. Output text only.";

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...garmentParts, { text: prompt }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing garments:", error);
        return "The exact garments as shown in the reference images."; // Fallback description
    }
};

// New function to analyze hairstyle images
export const analyzeHairstyle = async (ai: GoogleGenAI, hairstyle: Hairstyle | null): Promise<string> => {
    if (!hairstyle) return "No hairstyle provided.";
    const hairstyleBase64 = await fileToBase64(hairstyle.file);
    const hairstylePart = { inlineData: { data: hairstyleBase64, mimeType: hairstyle.file.type } };
    const prompt = "Analyze ONLY the hairstyle in this image. IGNORE the person, their face, and the background. Your description must be strictly limited to the hair itself. Describe its color, length, texture (e.g., curly, straight, wavy), and specific style (e.g., bob cut, ponytail, braids). Do not mention the person wearing it. Be factual and detailed. Output text only.";
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [hairstylePart, { text: prompt }] },
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing hairstyle:", error);
        return "The hairstyle as depicted in the reference image."; // Fallback
    }
};

export const blurFaceInImage = async (imageFile: File): Promise<File> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };

    const promptText = "Find any human faces in this image and apply a strong, feature-obscuring gaussian blur to them. Do not alter any other part of the image, including hair, background, or clothing. The output MUST be only the edited image, with no added text or explanation.";
    const textPart = { text: promptText };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];
        const imagePartResponse = candidate?.content?.parts?.find(p => p.inlineData);

        if (imagePartResponse && imagePartResponse.inlineData) {
            const base64ImageBytes = imagePartResponse.inlineData.data;
            const mimeType = imagePartResponse.inlineData.mimeType || imageFile.type;
            return base64StringToFile(base64ImageBytes, `blurred-${imageFile.name}`, mimeType);
        } else {
            console.error("No image part found in blur response.", { response });
            throw new Error("Failed to blur face: No image data returned.");
        }
    } catch (error) {
        console.error("Error blurring face:", error);
        throw new Error("An error occurred while blurring the face in the image.");
    }
};


export const generateTryOnImages = async (
    ai: GoogleGenAI,
    model: Model,
    outfit: Outfit,
    hairstyle: Hairstyle | null,
    instructions: string,
    lockFace: boolean,
    modelAnalysis: string,
    hairstyleAnalysis: string
): Promise<string[]> => {
    
    // Step 1: Analyze garments for the current outfit
    const garmentsAnalysis = await analyzeGarments(ai, outfit);
    
    // Pre-load all image data
    const modelBase64 = await fileToBase64(model.file);
    const modelPart = { inlineData: { data: modelBase64, mimeType: model.file.type } };
    
    let hairstylePart = null;
    if (hairstyle) {
        const hairstyleBase64 = await fileToBase64(hairstyle.file);
        hairstylePart = { inlineData: { data: hairstyleBase64, mimeType: hairstyle.file.type } };
    }

    const hasGarments = outfit.garments.length > 0;
    const garmentParts = await Promise.all(outfit.garments.map(async (g) => {
        const base64 = await fileToBase64(g.file);
        return { inlineData: { data: base64, mimeType: g.file.type } };
    }));
    
    const posesAndAngles = [
        "Full-body fashion shot, model looking confidently at the camera, dynamic pose.",
        "Three-quarters view, stylish, relaxed pose against a clean background.",
        "Medium shot from the waist up, focusing on the outfit details, natural candid pose.",
        "Walking towards the camera, candid street style shot.",
        "Leaning against a textured wall, relaxed and looking away from the camera.",
    ];
    
    const generatedImages: string[] = [];

    for (const [i, poseInstruction] of posesAndAngles.entries()) {
        try {
            const defaultScene = "A clean, minimalist, brightly lit photography studio.";
            const userScene = instructions.trim() ? instructions : defaultScene;

            const parts = [];
            
            // Person image is always first
            parts.push({ text: "**[PERSON IMAGE]**" });
            parts.push(modelPart);

            if (hairstylePart) {
                parts.push({ text: "**[HAIRSTYLE IMAGE]**" });
                parts.push(hairstylePart);
            }

            if (hasGarments) {
                parts.push({ text: "**[GARMENT IMAGES]**" });
                parts.push(...garmentParts);
            }
            
            const finalInstructions = `
# TASK: VIRTUAL TRY-ON

## UNBREAKABLE CORE DIRECTIVE:
**REPLICATE THE PERSON from [PERSON IMAGE] EXACTLY.** The face, body shape, and skin texture are non-negotiable. Any change to their identity is a failure.

---

## REFERENCE ASSETS:

*   **[PERSON IMAGE]:** The base image. This person's identity MUST be preserved.
    *   **Model Analysis:** ${modelAnalysis}
*   **[GARMENT IMAGES]:** The clothing to apply.
    *   **Garment Analysis:** ${garmentsAnalysis}
*   **[HAIRSTYLE IMAGE]:** (If provided) The hairstyle to apply. The face in this image is IRRELEVANT.
    *   **Hairstyle Analysis:** ${hairstyleAnalysis}

---

## EXECUTION ORDER:

1.  **BASE:** Use the person from **[PERSON IMAGE]**.
2.  **DRESS:** Apply the exact clothes from **[GARMENT IMAGES]**.
3.  **HAIR:** ${hairstyle ? `Replace the hair with the style from **[HAIRSTYLE IMAGE]**.` : `Keep the original hair.`}
4.  **POSE & SCENE:** Place the person in this setting: "${userScene}", with this pose: "${poseInstruction}".
5.  **FACE LOCK:** ${lockFace ? `Facial features MUST be a 100% match to the [PERSON IMAGE].` : `Preserve facial features with high fidelity.`}
6.  **REALISM:** Maintain natural skin texture. Do not airbrush. Pores should be visible.

---

## FINAL OUTPUT:
Generate ONLY the final image. No text.
`;
            parts.push({ text: finalInstructions });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const candidate = response.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                const mimeType = imagePart.inlineData.mimeType || 'image/png';
                const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                generatedImages.push(imageUrl);
            } else {
                 console.warn(`No image part found for generation ${i + 1}. The AI may have refused the request or returned only text. Full response:`, { response });
                 generatedImages.push(`https://picsum.photos/seed/${Math.random()}/512/768?text=Generation+Failed`);
            }
        } catch (error) {
            console.error(`Error generating image ${i + 1}:`, error);
            generatedImages.push(`https://picsum.photos/seed/error${i}/512/768?text=Error`);
        }
    }

    return generatedImages;
};

export const enhanceImageRealism = async (imageFile: File): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imageBase64 = await fileToBase64(imageFile);
    const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };

    const promptText = `
**PRIMARY GOAL: HYPERREALISTIC ENHANCEMENT**

**NON-NEGOTIABLE RULE:**
You MUST preserve the subject's exact pose, facial expression, and all compositional elements from the original image. Do NOT change the person, their expression, the way they are standing/sitting, or the camera angle. Your only task is to enhance the realism of the existing image content. Changing the pose or expression is a failure.

---
**DETAILED INSTRUCTIONS:**

Recreate the image with maximum ultrarealistic, photorealistic fidelity while preserving the exact original composition, colors, and subject matter. The goal is to transform the image into something indistinguishable from a real photograph captured on a professional DSLR or cinema camera. Every element should be true-to-life, grounded in natural optics, and free of artificial polish.

The rendering of skin texture must be **exaggerated for maximum realism**, pushing the boundaries of photorealism. Render skin with authentic, **hyper-detailed** natural texture. Pores must be **clearly visible** and varied in size across different areas of the face and body: **noticeably** larger and more defined around the nose, forehead, and cheeks, softer and finer along the temples, jawline, and under the eyes. Each pore must catch light realistically, creating **distinct micro-shadows and highlights** that shift with the angle of illumination. The skin surface must show a subtle but **clear** oil balance, with a gentle sheen in naturally reflective zones (T-zone, chin, upper lip) and a more matte texture in drier areas. Fine vellus hair (peach fuzz) must be clearly visible when light catches it. **Amplify** the presence of fine lines, tiny bumps, faint veins, natural uneven pigmentation, and slight variations in tone. Preserve the true undertones of the skin (warm, cool, or neutral) without altering the natural complexion. Maintain lifelike subsurface scattering, accurate highlight rolloff, and realistic specular reflections that follow real-world lighting behavior. Do not erase imperfections; subtle scars, minor dryness, faint redness, and organic variation must remain intact for realism.

Hair must be rendered with exceptional realism. Individual strands should be distinct, with subtle variations in color and thickness. Capture the natural flow and texture, whether straight, wavy, or curly. Show how light interacts with the hair: specular highlights on individual strands, soft sheen on larger sections, and realistic translucency where light passes through the edges. Include natural imperfections like subtle flyaways and split ends. The hairline should be soft and natural, with fine baby hairs seamlessly blending into the skin.

Color science must follow real-world photography principles. White balance should be accurate and consistent with the original image’s lighting. Avoid unnatural color shifts. Keep neutrals neutral, preserve mid-tones, and maintain realistic saturation. Skin tones should never appear over-saturated, neon, or orange/magenta shifted. Shadows should remain clean without green or muddy casts, and highlights must roll off naturally without clipping. Colors in the environment, clothing, and background should remain balanced, believable, and harmonized with the subject without artificial oversaturation or flattening.

Texture fidelity should be preserved across every surface: skin, hair, fabric weave, natural fibers, wood grain, metal reflections, glass transparency, environmental surfaces, and small background details. Depth of field must remain consistent with the original image—do not introduce artificial blur or sharpness where it did not exist. If the original had background blur, keep it; if it was sharp, preserve it. Optics should mimic real lenses: natural vignetting, realistic depth, slight chromatic aberration control, and true perspective.

The overall rendering should match the look of a RAW photo: full dynamic range, soft highlight falloff, rich yet accurate mid-tones, and clean shadow detail. Add subtle photographic noise or natural film grain for authenticity, ensuring the image avoids a sterile, overly polished look.

Finally, upscale the result to a high resolution (e.g., 2048x2048 pixels). This upscaling step is **critical** and **non-negotiable** for final realism. You **MUST** use the increased resolution to further enhance and intensify the hyperrealistic textures you have already rendered. Skin pores, vellus hair, and fabric threads **MUST** become even more distinct and clear. Any form of artificial smoothing, blurring, or loss of detail during upscaling is a strict failure. The final image should appear as if it were natively captured at this higher resolution, revealing more organic detail, not looking like a digitally enlarged photo.

Do not include: plastic or waxy skin textures, porcelain doll appearance, beauty filter smoothing, airbrushed or artificial retouching, fake freckles unless they were present in the original, CGI gloss, cartoonish or painterly effects, watercolor artifacts, extreme HDR glow, haloing, neon or oversaturated colors, unnatural orange/magenta/green casts, duplicated facial features, warped or misaligned eyes, unnatural makeup overlays, excessive sharpening, AI blur, misrendered hands or fingers, extra limbs, or anything that breaks photorealism. Be sure the final result avoids all signs of AI artifacts and instead reflects true human imperfection, organic color, and natural photographic depth.
`;
    const textPart = { text: promptText };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];
        const imagePartResponse = candidate?.content?.parts?.find(p => p.inlineData);

        if (imagePartResponse && imagePartResponse.inlineData) {
            const base64ImageBytes = imagePartResponse.inlineData.data;
            return `data:${imagePartResponse.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else {
            console.error("No image part found in enhancement response.", { response });
            throw new Error("Failed to enhance image: No image data returned.");
        }
    } catch (error) {
        console.error("Error enhancing image:", error);
        throw new Error("An error occurred while enhancing the image.");
    }
};