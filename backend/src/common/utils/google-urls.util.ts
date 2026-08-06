export const generarUrlsGoogleForm = (idFormulario: string) => ({
  urlEdicion: `https://docs.google.com/forms/d/${idFormulario}/edit`,
  urlRespuesta: `https://docs.google.com/forms/d/${idFormulario}/viewform`
});