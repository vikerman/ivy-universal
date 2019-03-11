type QueryFn = (ctx: Map<string, {}>) => string;

const dataInputsMap = new Map<Object, Map<string, string | QueryFn>>();

/* Add a mapping from the target prototype to a */
export function InitialData(url: string | QueryFn) {
  return (target: any, propertyName: string) => {
    let propToUrl  = dataInputsMap.get(target);
    if (!propToUrl) {
      propToUrl = new Map<string, string | QueryFn>();
      dataInputsMap.set(target, propToUrl);
    }
    propToUrl.set(propertyName, url);
  };
}

/* Get the data inputs for a given component prototype */
export function getDataInputs(target: any) : Map<string, string | QueryFn> | undefined {
  return dataInputsMap.get(target);
}
