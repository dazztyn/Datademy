interface Window {
  gapi: {
    load: (apiName: string, callback: () => void) => void;
    client: any; 
  };
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: { access_token: string; error?: any }) => void;
        }) => { requestAccessToken: () => void };
      };
    };
    picker: {
      PickerBuilder: new () => any;
      DocsView: new () => any;
      ViewId: { DOCS: string };
      Action: { PICKED: string };
    };
  };
}