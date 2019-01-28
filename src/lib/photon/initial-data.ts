const dataInputsMap = new Map<Object, Map<string, string>>();

/* Add a mapping from the target prototype to a */
export function InitialData(url: string) {
  return (target: any, propertyName: string) => {
    let propToUrl  = dataInputsMap.get(target.constructor);
    if (!propToUrl) {
      propToUrl = new Map<string, string>();
      dataInputsMap.set(target.constructor, propToUrl);
    }
    propToUrl.set(propertyName, url);
  };
}

/* Get the data inputs for a given component prototype */
export function getDataInputs(target: any) : Map<string, string> | undefined {
  return dataInputsMap.get(target);
}
