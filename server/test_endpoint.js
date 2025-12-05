
import { Blob } from 'buffer';

async function testEndpoint() {
    try {
        const formData = new FormData();
        const fileContent = 'Test file content for server endpoint';

        // Node's FormData might need a Blob or File compatible object
        // In Node 18+, we can verify if global File exists, otherwise use Blob
        const file = new Blob([fileContent], { type: 'text/plain' });
        formData.append('photos', file, 'test_endpoint_file.txt');

        console.log('Sending request to http://localhost:3000/upload...');

        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response body:', text);

        if (!response.ok) {
            console.error('Request failed');
        }
    } catch (error) {
        console.error('Error testing endpoint:', error);
    }
}

testEndpoint();
