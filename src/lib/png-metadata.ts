export async function extractPngMetadata(file: File): Promise<any> {
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
                                resolve(parsed);
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
