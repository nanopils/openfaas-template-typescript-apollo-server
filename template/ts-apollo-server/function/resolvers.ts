export default {
        Query: {
          hello: async (obj, args, context, info) => {
            console.log(context)
            console.log(info)
            return `text:${args.text},obj:${obj},text:${context},text:${info}`
          }
        }
}