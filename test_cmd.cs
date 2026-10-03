using System;
using System.Reflection;
using Aspire.Hosting;

class Program {
    static void Main() {
        var methods = typeof(ResourceBuilderExtensions).GetMethods(BindingFlags.Public | BindingFlags.Static);
        foreach(var m in methods) {
            if (m.Name.Contains("Command") || m.Name.Contains("Start"))
                Console.WriteLine(m.Name);
        }
    }
}
