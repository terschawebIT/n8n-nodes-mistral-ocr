import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MistralApi implements ICredentialType {
	name = 'mistralApi';

	displayName = 'Mistral API';

	documentationUrl = 'https://docs.mistral.ai/api/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Mistral API key. You can find it in your Mistral account settings.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mistral.ai',
			url: '/v1/models',
			method: 'GET',
		},
	};
}
