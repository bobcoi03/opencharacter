// Add interface for character data
interface CharacterData {
    name: string;
    tagline: string;
    description: string;
    greeting: string;
    visibility: string;
    avatar_image_url?: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    min_p?: number;
    top_a?: number;
    max_tokens?: number;
    tags?: string[];
}

function processCharacterData(content: any): CharacterData {
    let processedData: CharacterData;

    // Handle Character.AI format
    if (content.char_name || content.char_persona || content.example_dialogue || content.mes_example) {
        // Combine all descriptive fields into one comprehensive description
        const descriptionParts = [
            content.char_persona ? `Character Persona:\n${content.char_persona}\n\n` : '',
            content.description ? `Description:\n${content.description}\n\n` : '',
            content.example_dialogue ? `Example Dialogue:\n${content.example_dialogue}\n\n` : '',
            content.mes_example ? `Message Examples:\n${content.mes_example}` : ''
        ].filter(Boolean);

        const combinedDescription = descriptionParts.join('').trim();
        
        // Get tagline from personality or first line of char_persona
        const tagline = content.personality || 
                      (content.char_persona ? content.char_persona.split('\n')[0] : '') || 
                      content.description || 
                      'No description available';

        processedData = {
            name: content.char_name || content.name || content.name || 'Unnamed Character',
            tagline: tagline,
            description: combinedDescription || content.description || content.char_persona || tagline,
            greeting: content.char_greeting || content.first_mes || `Hello! I'm ${content.char_name || content.name}`,
            visibility: "public",
            temperature: 1.0,
            top_p: 1.0,
            top_k: 0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            repetition_penalty: 1.0,
            min_p: 0.0,
            top_a: 0.0,
            max_tokens: 600,
            tags: []
        };
    }
    // Handle Chara Card V2 format
    else if (content.spec === "chara_card_v2" && content.data) {
        const tagline = content.data.personality || content.data.description.slice(0, 500) + "...";
        processedData = {
            name: content.data.name || 'Unnamed Character',
            tagline: tagline,
            description: content.data.description || tagline,
            greeting: content.data.first_mes || 'Hello!',
            visibility: "public",
            avatar_image_url: content.data.avatar,
            temperature: 1.0,
            top_p: 1.0,
            top_k: 0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            repetition_penalty: 1.0,
            min_p: 0.0,
            top_a: 0.0,
            max_tokens: 600,
            tags: []
        };
    }
    // Handle direct format
    else {
        processedData = {
            name: content.name || 'Unnamed Character',
            tagline: content.tagline || content.description || 'No description available',
            description: content.description || content.tagline || 'No description available',
            greeting: content.greeting || 'Hello!',
            visibility: content.visibility || "public",
            avatar_image_url: content.avatar_image_url,
            temperature: content.temperature || 1.0,
            top_p: content.top_p || 1.0,
            top_k: content.top_k || 0,
            frequency_penalty: content.frequency_penalty || 0.0,
            presence_penalty: content.presence_penalty || 0.0,
            repetition_penalty: content.repetition_penalty || 1.0,
            min_p: content.min_p || 0.0,
            top_a: content.top_a || 0.0,
            max_tokens: content.max_tokens || 600,
            tags: content.tags || []
        };
    }

    // Validate that all required fields are non-empty
    if (!processedData.name?.trim()) throw new Error('Name is required');
    if (!processedData.tagline?.trim()) throw new Error('Tagline is required');
    if (!processedData.description?.trim()) throw new Error('Description is required');
    if (!processedData.greeting?.trim()) throw new Error('Greeting is required');

    return processedData;
}

export async function extractPngMetadata(file: File): Promise<CharacterData> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                console.log('File loaded, starting metadata extraction');
                const img = new Image();
                img.src = e.target?.result as string;

                await new Promise((imgResolve) => {
                    img.onload = () => {
                        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
                        imgResolve(true);
                    };
                });

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);

                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                console.log('Image data extracted from canvas');
                
                const binary = atob((e.target?.result as string).split(',')[1]);
                const chunks = [];
                let offset = 8;

                console.log('Starting PNG chunk parsing');
                while (offset < binary.length) {
                    const length = parseInt(binary.slice(offset, offset + 4).split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(''), 16);
                    const type = binary.slice(offset + 4, offset + 8);
                    const data = binary.slice(offset + 8, offset + 8 + length);
                    
                    console.log('Chunk found:', type, 'length:', length);
                    
                    if (type === 'tEXt') {
                        const nullIndex = data.indexOf('\0');
                        const keyword = data.slice(0, nullIndex);
                        const text = data.slice(nullIndex + 1);
                        
                        console.log('tEXt chunk found, keyword:', keyword);
                        
                        if (keyword === 'chara') {
                            try {
                                const decoded = atob(text);
                                const parsed = JSON.parse(decoded);
                                console.log('Successfully extracted and parsed chara data');
                                resolve(processCharacterData(parsed));
                                return;
                            } catch (e) {
                                console.error('Failed to parse chara data:', e);
                            }
                        }
                    }
                    
                    offset += 8 + length + 4;
                }
                
                console.warn('No character data found in PNG');
                reject(new Error('No character data found in PNG'));
            } catch (error) {
                console.error('Error during metadata extraction:', error);
                reject(error);
            }
        };
        reader.onerror = (error) => {
            console.error('Failed to read PNG file:', error);
            reject(new Error('Failed to read PNG file'));
        };
        reader.readAsDataURL(file);
    });
}
