import axios from "axios";


const createZoomMeeting = async (topic, duration, startTime, meetingPassword) => {
    try {
        const base64Credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

        const authResponse = await axios.post(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`, {}, {
            headers: {
                'Authorization': `Basic ${base64Credentials}`
            }
        });
        const access_token = authResponse.data.access_token

        const headers = {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }


        let data = JSON.stringify({
            "topic": topic,
            "type": 2,
            "start_time": startTime,
            ...(duration && {
                "duration": duration,
            }),
            "password": meetingPassword || "",
            "settings": {
                "join_before_host": true,
                "waiting_room": true,
                "mute_upon_entry": true,
                "participant_video": false,
            }
        });

        const meetingResponse = await axios.post(`https://api.zoom.us/v2/users/me/meetings`, data, { headers });

        if (meetingResponse.status !== 201) {
            return 'Unable to generate meeting link'
        }
        const response_data = meetingResponse.data;

    
        function extractZakToken(url) {
            const params = new URLSearchParams(new URL(url).search);
            return params.get('zak');
        }

        const content = {
            meetingId: response_data.id, //For instructors
            meetingPassword: response_data.password,
            zakToken:extractZakToken(response_data.start_url),
            success: true,
        };
        return content

    } catch (e) {
        console.log(e)
    }
}

export default createZoomMeeting