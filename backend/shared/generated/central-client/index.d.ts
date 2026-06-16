
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model tenants
 * 
 */
export type tenants = $Result.DefaultSelection<Prisma.$tenantsPayload>
/**
 * Model tenant_modules
 * 
 */
export type tenant_modules = $Result.DefaultSelection<Prisma.$tenant_modulesPayload>
/**
 * Model central_user_index
 * 
 */
export type central_user_index = $Result.DefaultSelection<Prisma.$central_user_indexPayload>
/**
 * Model tenant_branch_links
 * 
 */
export type tenant_branch_links = $Result.DefaultSelection<Prisma.$tenant_branch_linksPayload>
/**
 * Model central_kyc_records
 * 
 */
export type central_kyc_records = $Result.DefaultSelection<Prisma.$central_kyc_recordsPayload>
/**
 * Model central_gst_records
 * 
 */
export type central_gst_records = $Result.DefaultSelection<Prisma.$central_gst_recordsPayload>
/**
 * Model platform_settings
 * 
 */
export type platform_settings = $Result.DefaultSelection<Prisma.$platform_settingsPayload>
/**
 * Model tenant_pricing_configs
 * 
 */
export type tenant_pricing_configs = $Result.DefaultSelection<Prisma.$tenant_pricing_configsPayload>
/**
 * Model invoices
 * 
 */
export type invoices = $Result.DefaultSelection<Prisma.$invoicesPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Tenants
 * const tenants = await prisma.tenants.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Tenants
   * const tenants = await prisma.tenants.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.tenants`: Exposes CRUD operations for the **tenants** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenants
    * const tenants = await prisma.tenants.findMany()
    * ```
    */
  get tenants(): Prisma.tenantsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenant_modules`: Exposes CRUD operations for the **tenant_modules** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenant_modules
    * const tenant_modules = await prisma.tenant_modules.findMany()
    * ```
    */
  get tenant_modules(): Prisma.tenant_modulesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.central_user_index`: Exposes CRUD operations for the **central_user_index** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Central_user_indices
    * const central_user_indices = await prisma.central_user_index.findMany()
    * ```
    */
  get central_user_index(): Prisma.central_user_indexDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenant_branch_links`: Exposes CRUD operations for the **tenant_branch_links** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenant_branch_links
    * const tenant_branch_links = await prisma.tenant_branch_links.findMany()
    * ```
    */
  get tenant_branch_links(): Prisma.tenant_branch_linksDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.central_kyc_records`: Exposes CRUD operations for the **central_kyc_records** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Central_kyc_records
    * const central_kyc_records = await prisma.central_kyc_records.findMany()
    * ```
    */
  get central_kyc_records(): Prisma.central_kyc_recordsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.central_gst_records`: Exposes CRUD operations for the **central_gst_records** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Central_gst_records
    * const central_gst_records = await prisma.central_gst_records.findMany()
    * ```
    */
  get central_gst_records(): Prisma.central_gst_recordsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.platform_settings`: Exposes CRUD operations for the **platform_settings** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Platform_settings
    * const platform_settings = await prisma.platform_settings.findMany()
    * ```
    */
  get platform_settings(): Prisma.platform_settingsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.tenant_pricing_configs`: Exposes CRUD operations for the **tenant_pricing_configs** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tenant_pricing_configs
    * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findMany()
    * ```
    */
  get tenant_pricing_configs(): Prisma.tenant_pricing_configsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.invoices`: Exposes CRUD operations for the **invoices** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invoices
    * const invoices = await prisma.invoices.findMany()
    * ```
    */
  get invoices(): Prisma.invoicesDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */

  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    tenants: 'tenants',
    tenant_modules: 'tenant_modules',
    central_user_index: 'central_user_index',
    tenant_branch_links: 'tenant_branch_links',
    central_kyc_records: 'central_kyc_records',
    central_gst_records: 'central_gst_records',
    platform_settings: 'platform_settings',
    tenant_pricing_configs: 'tenant_pricing_configs',
    invoices: 'invoices'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "tenants" | "tenant_modules" | "central_user_index" | "tenant_branch_links" | "central_kyc_records" | "central_gst_records" | "platform_settings" | "tenant_pricing_configs" | "invoices"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      tenants: {
        payload: Prisma.$tenantsPayload<ExtArgs>
        fields: Prisma.tenantsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenantsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenantsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          findFirst: {
            args: Prisma.tenantsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenantsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          findMany: {
            args: Prisma.tenantsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          create: {
            args: Prisma.tenantsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          createMany: {
            args: Prisma.tenantsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenantsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          delete: {
            args: Prisma.tenantsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          update: {
            args: Prisma.tenantsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          deleteMany: {
            args: Prisma.tenantsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenantsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenantsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>[]
          }
          upsert: {
            args: Prisma.tenantsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenantsPayload>
          }
          aggregate: {
            args: Prisma.TenantsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenants>
          }
          groupBy: {
            args: Prisma.tenantsGroupByArgs<ExtArgs>
            result: $Utils.Optional<TenantsGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenantsCountArgs<ExtArgs>
            result: $Utils.Optional<TenantsCountAggregateOutputType> | number
          }
        }
      }
      tenant_modules: {
        payload: Prisma.$tenant_modulesPayload<ExtArgs>
        fields: Prisma.tenant_modulesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenant_modulesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenant_modulesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          findFirst: {
            args: Prisma.tenant_modulesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenant_modulesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          findMany: {
            args: Prisma.tenant_modulesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>[]
          }
          create: {
            args: Prisma.tenant_modulesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          createMany: {
            args: Prisma.tenant_modulesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenant_modulesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>[]
          }
          delete: {
            args: Prisma.tenant_modulesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          update: {
            args: Prisma.tenant_modulesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          deleteMany: {
            args: Prisma.tenant_modulesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenant_modulesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenant_modulesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>[]
          }
          upsert: {
            args: Prisma.tenant_modulesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_modulesPayload>
          }
          aggregate: {
            args: Prisma.Tenant_modulesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenant_modules>
          }
          groupBy: {
            args: Prisma.tenant_modulesGroupByArgs<ExtArgs>
            result: $Utils.Optional<Tenant_modulesGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenant_modulesCountArgs<ExtArgs>
            result: $Utils.Optional<Tenant_modulesCountAggregateOutputType> | number
          }
        }
      }
      central_user_index: {
        payload: Prisma.$central_user_indexPayload<ExtArgs>
        fields: Prisma.central_user_indexFieldRefs
        operations: {
          findUnique: {
            args: Prisma.central_user_indexFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.central_user_indexFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          findFirst: {
            args: Prisma.central_user_indexFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.central_user_indexFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          findMany: {
            args: Prisma.central_user_indexFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>[]
          }
          create: {
            args: Prisma.central_user_indexCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          createMany: {
            args: Prisma.central_user_indexCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.central_user_indexCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>[]
          }
          delete: {
            args: Prisma.central_user_indexDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          update: {
            args: Prisma.central_user_indexUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          deleteMany: {
            args: Prisma.central_user_indexDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.central_user_indexUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.central_user_indexUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>[]
          }
          upsert: {
            args: Prisma.central_user_indexUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_user_indexPayload>
          }
          aggregate: {
            args: Prisma.Central_user_indexAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCentral_user_index>
          }
          groupBy: {
            args: Prisma.central_user_indexGroupByArgs<ExtArgs>
            result: $Utils.Optional<Central_user_indexGroupByOutputType>[]
          }
          count: {
            args: Prisma.central_user_indexCountArgs<ExtArgs>
            result: $Utils.Optional<Central_user_indexCountAggregateOutputType> | number
          }
        }
      }
      tenant_branch_links: {
        payload: Prisma.$tenant_branch_linksPayload<ExtArgs>
        fields: Prisma.tenant_branch_linksFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenant_branch_linksFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenant_branch_linksFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          findFirst: {
            args: Prisma.tenant_branch_linksFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenant_branch_linksFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          findMany: {
            args: Prisma.tenant_branch_linksFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>[]
          }
          create: {
            args: Prisma.tenant_branch_linksCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          createMany: {
            args: Prisma.tenant_branch_linksCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenant_branch_linksCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>[]
          }
          delete: {
            args: Prisma.tenant_branch_linksDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          update: {
            args: Prisma.tenant_branch_linksUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          deleteMany: {
            args: Prisma.tenant_branch_linksDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenant_branch_linksUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenant_branch_linksUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>[]
          }
          upsert: {
            args: Prisma.tenant_branch_linksUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_branch_linksPayload>
          }
          aggregate: {
            args: Prisma.Tenant_branch_linksAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenant_branch_links>
          }
          groupBy: {
            args: Prisma.tenant_branch_linksGroupByArgs<ExtArgs>
            result: $Utils.Optional<Tenant_branch_linksGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenant_branch_linksCountArgs<ExtArgs>
            result: $Utils.Optional<Tenant_branch_linksCountAggregateOutputType> | number
          }
        }
      }
      central_kyc_records: {
        payload: Prisma.$central_kyc_recordsPayload<ExtArgs>
        fields: Prisma.central_kyc_recordsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.central_kyc_recordsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.central_kyc_recordsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          findFirst: {
            args: Prisma.central_kyc_recordsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.central_kyc_recordsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          findMany: {
            args: Prisma.central_kyc_recordsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>[]
          }
          create: {
            args: Prisma.central_kyc_recordsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          createMany: {
            args: Prisma.central_kyc_recordsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.central_kyc_recordsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>[]
          }
          delete: {
            args: Prisma.central_kyc_recordsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          update: {
            args: Prisma.central_kyc_recordsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          deleteMany: {
            args: Prisma.central_kyc_recordsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.central_kyc_recordsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.central_kyc_recordsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>[]
          }
          upsert: {
            args: Prisma.central_kyc_recordsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_kyc_recordsPayload>
          }
          aggregate: {
            args: Prisma.Central_kyc_recordsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCentral_kyc_records>
          }
          groupBy: {
            args: Prisma.central_kyc_recordsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Central_kyc_recordsGroupByOutputType>[]
          }
          count: {
            args: Prisma.central_kyc_recordsCountArgs<ExtArgs>
            result: $Utils.Optional<Central_kyc_recordsCountAggregateOutputType> | number
          }
        }
      }
      central_gst_records: {
        payload: Prisma.$central_gst_recordsPayload<ExtArgs>
        fields: Prisma.central_gst_recordsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.central_gst_recordsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.central_gst_recordsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          findFirst: {
            args: Prisma.central_gst_recordsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.central_gst_recordsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          findMany: {
            args: Prisma.central_gst_recordsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>[]
          }
          create: {
            args: Prisma.central_gst_recordsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          createMany: {
            args: Prisma.central_gst_recordsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.central_gst_recordsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>[]
          }
          delete: {
            args: Prisma.central_gst_recordsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          update: {
            args: Prisma.central_gst_recordsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          deleteMany: {
            args: Prisma.central_gst_recordsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.central_gst_recordsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.central_gst_recordsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>[]
          }
          upsert: {
            args: Prisma.central_gst_recordsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$central_gst_recordsPayload>
          }
          aggregate: {
            args: Prisma.Central_gst_recordsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCentral_gst_records>
          }
          groupBy: {
            args: Prisma.central_gst_recordsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Central_gst_recordsGroupByOutputType>[]
          }
          count: {
            args: Prisma.central_gst_recordsCountArgs<ExtArgs>
            result: $Utils.Optional<Central_gst_recordsCountAggregateOutputType> | number
          }
        }
      }
      platform_settings: {
        payload: Prisma.$platform_settingsPayload<ExtArgs>
        fields: Prisma.platform_settingsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.platform_settingsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.platform_settingsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          findFirst: {
            args: Prisma.platform_settingsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.platform_settingsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          findMany: {
            args: Prisma.platform_settingsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>[]
          }
          create: {
            args: Prisma.platform_settingsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          createMany: {
            args: Prisma.platform_settingsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.platform_settingsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>[]
          }
          delete: {
            args: Prisma.platform_settingsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          update: {
            args: Prisma.platform_settingsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          deleteMany: {
            args: Prisma.platform_settingsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.platform_settingsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.platform_settingsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>[]
          }
          upsert: {
            args: Prisma.platform_settingsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$platform_settingsPayload>
          }
          aggregate: {
            args: Prisma.Platform_settingsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePlatform_settings>
          }
          groupBy: {
            args: Prisma.platform_settingsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Platform_settingsGroupByOutputType>[]
          }
          count: {
            args: Prisma.platform_settingsCountArgs<ExtArgs>
            result: $Utils.Optional<Platform_settingsCountAggregateOutputType> | number
          }
        }
      }
      tenant_pricing_configs: {
        payload: Prisma.$tenant_pricing_configsPayload<ExtArgs>
        fields: Prisma.tenant_pricing_configsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.tenant_pricing_configsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.tenant_pricing_configsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          findFirst: {
            args: Prisma.tenant_pricing_configsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.tenant_pricing_configsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          findMany: {
            args: Prisma.tenant_pricing_configsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>[]
          }
          create: {
            args: Prisma.tenant_pricing_configsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          createMany: {
            args: Prisma.tenant_pricing_configsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.tenant_pricing_configsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>[]
          }
          delete: {
            args: Prisma.tenant_pricing_configsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          update: {
            args: Prisma.tenant_pricing_configsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          deleteMany: {
            args: Prisma.tenant_pricing_configsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.tenant_pricing_configsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.tenant_pricing_configsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>[]
          }
          upsert: {
            args: Prisma.tenant_pricing_configsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$tenant_pricing_configsPayload>
          }
          aggregate: {
            args: Prisma.Tenant_pricing_configsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTenant_pricing_configs>
          }
          groupBy: {
            args: Prisma.tenant_pricing_configsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Tenant_pricing_configsGroupByOutputType>[]
          }
          count: {
            args: Prisma.tenant_pricing_configsCountArgs<ExtArgs>
            result: $Utils.Optional<Tenant_pricing_configsCountAggregateOutputType> | number
          }
        }
      }
      invoices: {
        payload: Prisma.$invoicesPayload<ExtArgs>
        fields: Prisma.invoicesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.invoicesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.invoicesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          findFirst: {
            args: Prisma.invoicesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.invoicesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          findMany: {
            args: Prisma.invoicesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>[]
          }
          create: {
            args: Prisma.invoicesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          createMany: {
            args: Prisma.invoicesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.invoicesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>[]
          }
          delete: {
            args: Prisma.invoicesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          update: {
            args: Prisma.invoicesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          deleteMany: {
            args: Prisma.invoicesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.invoicesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.invoicesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>[]
          }
          upsert: {
            args: Prisma.invoicesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$invoicesPayload>
          }
          aggregate: {
            args: Prisma.InvoicesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoices>
          }
          groupBy: {
            args: Prisma.invoicesGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoicesGroupByOutputType>[]
          }
          count: {
            args: Prisma.invoicesCountArgs<ExtArgs>
            result: $Utils.Optional<InvoicesCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    tenants?: tenantsOmit
    tenant_modules?: tenant_modulesOmit
    central_user_index?: central_user_indexOmit
    tenant_branch_links?: tenant_branch_linksOmit
    central_kyc_records?: central_kyc_recordsOmit
    central_gst_records?: central_gst_recordsOmit
    platform_settings?: platform_settingsOmit
    tenant_pricing_configs?: tenant_pricing_configsOmit
    invoices?: invoicesOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */

  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TenantsCountOutputType
   */

  export type TenantsCountOutputType = {
    tenant_modules: number
    central_user_index: number
    tenant_branch_links: number
    invoices: number
  }

  export type TenantsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant_modules?: boolean | TenantsCountOutputTypeCountTenant_modulesArgs
    central_user_index?: boolean | TenantsCountOutputTypeCountCentral_user_indexArgs
    tenant_branch_links?: boolean | TenantsCountOutputTypeCountTenant_branch_linksArgs
    invoices?: boolean | TenantsCountOutputTypeCountInvoicesArgs
  }

  // Custom InputTypes
  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TenantsCountOutputType
     */
    select?: TenantsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountTenant_modulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_modulesWhereInput
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountCentral_user_indexArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: central_user_indexWhereInput
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountTenant_branch_linksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_branch_linksWhereInput
  }

  /**
   * TenantsCountOutputType without action
   */
  export type TenantsCountOutputTypeCountInvoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: invoicesWhereInput
  }


  /**
   * Models
   */

  /**
   * Model tenants
   */

  export type AggregateTenants = {
    _count: TenantsCountAggregateOutputType | null
    _avg: TenantsAvgAggregateOutputType | null
    _sum: TenantsSumAggregateOutputType | null
    _min: TenantsMinAggregateOutputType | null
    _max: TenantsMaxAggregateOutputType | null
  }

  export type TenantsAvgAggregateOutputType = {
    max_employees: number | null
    local_db_port: number | null
    sync_interval_min: number | null
  }

  export type TenantsSumAggregateOutputType = {
    max_employees: number | null
    local_db_port: number | null
    sync_interval_min: number | null
  }

  export type TenantsMinAggregateOutputType = {
    id: string | null
    name: string | null
    legal_name: string | null
    subdomain: string | null
    custom_domain: string | null
    logo_url: string | null
    primary_color: string | null
    background_color: string | null
    background_url: string | null
    sitemap_url: string | null
    plan: string | null
    plan_expires_at: Date | null
    max_employees: number | null
    db_mode: string | null
    db_url: string | null
    schema_name: string | null
    local_db_type: string | null
    local_db_host: string | null
    local_db_port: number | null
    local_db_name: string | null
    local_db_user: string | null
    local_db_pass: string | null
    sync_interval_min: number | null
    gstin: string | null
    pan: string | null
    city: string | null
    state: string | null
    address: string | null
    pincode: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    e_invoice_enabled: boolean | null
    admin_name: string | null
    admin_email: string | null
    admin_phone: string | null
    is_active: boolean | null
    is_setup_complete: boolean | null
    suspended_at: Date | null
    suspension_reason: string | null
    payout_config_enc: string | null
    created_at: Date | null
    updated_at: Date | null
    deleted_at: Date | null
  }

  export type TenantsMaxAggregateOutputType = {
    id: string | null
    name: string | null
    legal_name: string | null
    subdomain: string | null
    custom_domain: string | null
    logo_url: string | null
    primary_color: string | null
    background_color: string | null
    background_url: string | null
    sitemap_url: string | null
    plan: string | null
    plan_expires_at: Date | null
    max_employees: number | null
    db_mode: string | null
    db_url: string | null
    schema_name: string | null
    local_db_type: string | null
    local_db_host: string | null
    local_db_port: number | null
    local_db_name: string | null
    local_db_user: string | null
    local_db_pass: string | null
    sync_interval_min: number | null
    gstin: string | null
    pan: string | null
    city: string | null
    state: string | null
    address: string | null
    pincode: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    e_invoice_enabled: boolean | null
    admin_name: string | null
    admin_email: string | null
    admin_phone: string | null
    is_active: boolean | null
    is_setup_complete: boolean | null
    suspended_at: Date | null
    suspension_reason: string | null
    payout_config_enc: string | null
    created_at: Date | null
    updated_at: Date | null
    deleted_at: Date | null
  }

  export type TenantsCountAggregateOutputType = {
    id: number
    name: number
    legal_name: number
    subdomain: number
    custom_domain: number
    logo_url: number
    primary_color: number
    background_color: number
    background_url: number
    sitemap_url: number
    plan: number
    plan_expires_at: number
    max_employees: number
    db_mode: number
    db_url: number
    schema_name: number
    local_db_type: number
    local_db_host: number
    local_db_port: number
    local_db_name: number
    local_db_user: number
    local_db_pass: number
    sync_interval_min: number
    gstin: number
    pan: number
    city: number
    state: number
    address: number
    pincode: number
    gst_status: number
    gst_reg_date: number
    taxpayer_type: number
    constitution: number
    e_invoice_enabled: number
    business_nature: number
    admin_name: number
    admin_email: number
    admin_phone: number
    is_active: number
    is_setup_complete: number
    suspended_at: number
    suspension_reason: number
    payout_config_enc: number
    created_at: number
    updated_at: number
    deleted_at: number
    _all: number
  }


  export type TenantsAvgAggregateInputType = {
    max_employees?: true
    local_db_port?: true
    sync_interval_min?: true
  }

  export type TenantsSumAggregateInputType = {
    max_employees?: true
    local_db_port?: true
    sync_interval_min?: true
  }

  export type TenantsMinAggregateInputType = {
    id?: true
    name?: true
    legal_name?: true
    subdomain?: true
    custom_domain?: true
    logo_url?: true
    primary_color?: true
    background_color?: true
    background_url?: true
    sitemap_url?: true
    plan?: true
    plan_expires_at?: true
    max_employees?: true
    db_mode?: true
    db_url?: true
    schema_name?: true
    local_db_type?: true
    local_db_host?: true
    local_db_port?: true
    local_db_name?: true
    local_db_user?: true
    local_db_pass?: true
    sync_interval_min?: true
    gstin?: true
    pan?: true
    city?: true
    state?: true
    address?: true
    pincode?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    e_invoice_enabled?: true
    admin_name?: true
    admin_email?: true
    admin_phone?: true
    is_active?: true
    is_setup_complete?: true
    suspended_at?: true
    suspension_reason?: true
    payout_config_enc?: true
    created_at?: true
    updated_at?: true
    deleted_at?: true
  }

  export type TenantsMaxAggregateInputType = {
    id?: true
    name?: true
    legal_name?: true
    subdomain?: true
    custom_domain?: true
    logo_url?: true
    primary_color?: true
    background_color?: true
    background_url?: true
    sitemap_url?: true
    plan?: true
    plan_expires_at?: true
    max_employees?: true
    db_mode?: true
    db_url?: true
    schema_name?: true
    local_db_type?: true
    local_db_host?: true
    local_db_port?: true
    local_db_name?: true
    local_db_user?: true
    local_db_pass?: true
    sync_interval_min?: true
    gstin?: true
    pan?: true
    city?: true
    state?: true
    address?: true
    pincode?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    e_invoice_enabled?: true
    admin_name?: true
    admin_email?: true
    admin_phone?: true
    is_active?: true
    is_setup_complete?: true
    suspended_at?: true
    suspension_reason?: true
    payout_config_enc?: true
    created_at?: true
    updated_at?: true
    deleted_at?: true
  }

  export type TenantsCountAggregateInputType = {
    id?: true
    name?: true
    legal_name?: true
    subdomain?: true
    custom_domain?: true
    logo_url?: true
    primary_color?: true
    background_color?: true
    background_url?: true
    sitemap_url?: true
    plan?: true
    plan_expires_at?: true
    max_employees?: true
    db_mode?: true
    db_url?: true
    schema_name?: true
    local_db_type?: true
    local_db_host?: true
    local_db_port?: true
    local_db_name?: true
    local_db_user?: true
    local_db_pass?: true
    sync_interval_min?: true
    gstin?: true
    pan?: true
    city?: true
    state?: true
    address?: true
    pincode?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    e_invoice_enabled?: true
    business_nature?: true
    admin_name?: true
    admin_email?: true
    admin_phone?: true
    is_active?: true
    is_setup_complete?: true
    suspended_at?: true
    suspension_reason?: true
    payout_config_enc?: true
    created_at?: true
    updated_at?: true
    deleted_at?: true
    _all?: true
  }

  export type TenantsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenants to aggregate.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenants
    **/
    _count?: true | TenantsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TenantsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TenantsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TenantsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TenantsMaxAggregateInputType
  }

  export type GetTenantsAggregateType<T extends TenantsAggregateArgs> = {
        [P in keyof T & keyof AggregateTenants]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenants[P]>
      : GetScalarType<T[P], AggregateTenants[P]>
  }



  export type tenantsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenantsWhereInput
    orderBy?: tenantsOrderByWithAggregationInput | tenantsOrderByWithAggregationInput[]
    by: TenantsScalarFieldEnum[] | TenantsScalarFieldEnum
    having?: tenantsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TenantsCountAggregateInputType | true
    _avg?: TenantsAvgAggregateInputType
    _sum?: TenantsSumAggregateInputType
    _min?: TenantsMinAggregateInputType
    _max?: TenantsMaxAggregateInputType
  }

  export type TenantsGroupByOutputType = {
    id: string
    name: string
    legal_name: string | null
    subdomain: string
    custom_domain: string | null
    logo_url: string | null
    primary_color: string | null
    background_color: string | null
    background_url: string | null
    sitemap_url: string | null
    plan: string
    plan_expires_at: Date | null
    max_employees: number
    db_mode: string
    db_url: string | null
    schema_name: string | null
    local_db_type: string | null
    local_db_host: string | null
    local_db_port: number | null
    local_db_name: string | null
    local_db_user: string | null
    local_db_pass: string | null
    sync_interval_min: number | null
    gstin: string | null
    pan: string | null
    city: string | null
    state: string | null
    address: string | null
    pincode: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    e_invoice_enabled: boolean | null
    business_nature: JsonValue | null
    admin_name: string | null
    admin_email: string | null
    admin_phone: string | null
    is_active: boolean
    is_setup_complete: boolean
    suspended_at: Date | null
    suspension_reason: string | null
    payout_config_enc: string | null
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
    _count: TenantsCountAggregateOutputType | null
    _avg: TenantsAvgAggregateOutputType | null
    _sum: TenantsSumAggregateOutputType | null
    _min: TenantsMinAggregateOutputType | null
    _max: TenantsMaxAggregateOutputType | null
  }

  type GetTenantsGroupByPayload<T extends tenantsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TenantsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TenantsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TenantsGroupByOutputType[P]>
            : GetScalarType<T[P], TenantsGroupByOutputType[P]>
        }
      >
    >


  export type tenantsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    legal_name?: boolean
    subdomain?: boolean
    custom_domain?: boolean
    logo_url?: boolean
    primary_color?: boolean
    background_color?: boolean
    background_url?: boolean
    sitemap_url?: boolean
    plan?: boolean
    plan_expires_at?: boolean
    max_employees?: boolean
    db_mode?: boolean
    db_url?: boolean
    schema_name?: boolean
    local_db_type?: boolean
    local_db_host?: boolean
    local_db_port?: boolean
    local_db_name?: boolean
    local_db_user?: boolean
    local_db_pass?: boolean
    sync_interval_min?: boolean
    gstin?: boolean
    pan?: boolean
    city?: boolean
    state?: boolean
    address?: boolean
    pincode?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    e_invoice_enabled?: boolean
    business_nature?: boolean
    admin_name?: boolean
    admin_email?: boolean
    admin_phone?: boolean
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: boolean
    suspension_reason?: boolean
    payout_config_enc?: boolean
    created_at?: boolean
    updated_at?: boolean
    deleted_at?: boolean
    tenant_modules?: boolean | tenants$tenant_modulesArgs<ExtArgs>
    central_user_index?: boolean | tenants$central_user_indexArgs<ExtArgs>
    tenant_branch_links?: boolean | tenants$tenant_branch_linksArgs<ExtArgs>
    tenant_pricing_configs?: boolean | tenants$tenant_pricing_configsArgs<ExtArgs>
    invoices?: boolean | tenants$invoicesArgs<ExtArgs>
    _count?: boolean | TenantsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    legal_name?: boolean
    subdomain?: boolean
    custom_domain?: boolean
    logo_url?: boolean
    primary_color?: boolean
    background_color?: boolean
    background_url?: boolean
    sitemap_url?: boolean
    plan?: boolean
    plan_expires_at?: boolean
    max_employees?: boolean
    db_mode?: boolean
    db_url?: boolean
    schema_name?: boolean
    local_db_type?: boolean
    local_db_host?: boolean
    local_db_port?: boolean
    local_db_name?: boolean
    local_db_user?: boolean
    local_db_pass?: boolean
    sync_interval_min?: boolean
    gstin?: boolean
    pan?: boolean
    city?: boolean
    state?: boolean
    address?: boolean
    pincode?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    e_invoice_enabled?: boolean
    business_nature?: boolean
    admin_name?: boolean
    admin_email?: boolean
    admin_phone?: boolean
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: boolean
    suspension_reason?: boolean
    payout_config_enc?: boolean
    created_at?: boolean
    updated_at?: boolean
    deleted_at?: boolean
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    legal_name?: boolean
    subdomain?: boolean
    custom_domain?: boolean
    logo_url?: boolean
    primary_color?: boolean
    background_color?: boolean
    background_url?: boolean
    sitemap_url?: boolean
    plan?: boolean
    plan_expires_at?: boolean
    max_employees?: boolean
    db_mode?: boolean
    db_url?: boolean
    schema_name?: boolean
    local_db_type?: boolean
    local_db_host?: boolean
    local_db_port?: boolean
    local_db_name?: boolean
    local_db_user?: boolean
    local_db_pass?: boolean
    sync_interval_min?: boolean
    gstin?: boolean
    pan?: boolean
    city?: boolean
    state?: boolean
    address?: boolean
    pincode?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    e_invoice_enabled?: boolean
    business_nature?: boolean
    admin_name?: boolean
    admin_email?: boolean
    admin_phone?: boolean
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: boolean
    suspension_reason?: boolean
    payout_config_enc?: boolean
    created_at?: boolean
    updated_at?: boolean
    deleted_at?: boolean
  }, ExtArgs["result"]["tenants"]>

  export type tenantsSelectScalar = {
    id?: boolean
    name?: boolean
    legal_name?: boolean
    subdomain?: boolean
    custom_domain?: boolean
    logo_url?: boolean
    primary_color?: boolean
    background_color?: boolean
    background_url?: boolean
    sitemap_url?: boolean
    plan?: boolean
    plan_expires_at?: boolean
    max_employees?: boolean
    db_mode?: boolean
    db_url?: boolean
    schema_name?: boolean
    local_db_type?: boolean
    local_db_host?: boolean
    local_db_port?: boolean
    local_db_name?: boolean
    local_db_user?: boolean
    local_db_pass?: boolean
    sync_interval_min?: boolean
    gstin?: boolean
    pan?: boolean
    city?: boolean
    state?: boolean
    address?: boolean
    pincode?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    e_invoice_enabled?: boolean
    business_nature?: boolean
    admin_name?: boolean
    admin_email?: boolean
    admin_phone?: boolean
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: boolean
    suspension_reason?: boolean
    payout_config_enc?: boolean
    created_at?: boolean
    updated_at?: boolean
    deleted_at?: boolean
  }

  export type tenantsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "legal_name" | "subdomain" | "custom_domain" | "logo_url" | "primary_color" | "background_color" | "background_url" | "sitemap_url" | "plan" | "plan_expires_at" | "max_employees" | "db_mode" | "db_url" | "schema_name" | "local_db_type" | "local_db_host" | "local_db_port" | "local_db_name" | "local_db_user" | "local_db_pass" | "sync_interval_min" | "gstin" | "pan" | "city" | "state" | "address" | "pincode" | "gst_status" | "gst_reg_date" | "taxpayer_type" | "constitution" | "e_invoice_enabled" | "business_nature" | "admin_name" | "admin_email" | "admin_phone" | "is_active" | "is_setup_complete" | "suspended_at" | "suspension_reason" | "payout_config_enc" | "created_at" | "updated_at" | "deleted_at", ExtArgs["result"]["tenants"]>
  export type tenantsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant_modules?: boolean | tenants$tenant_modulesArgs<ExtArgs>
    central_user_index?: boolean | tenants$central_user_indexArgs<ExtArgs>
    tenant_branch_links?: boolean | tenants$tenant_branch_linksArgs<ExtArgs>
    tenant_pricing_configs?: boolean | tenants$tenant_pricing_configsArgs<ExtArgs>
    invoices?: boolean | tenants$invoicesArgs<ExtArgs>
    _count?: boolean | TenantsCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type tenantsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type tenantsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $tenantsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenants"
    objects: {
      tenant_modules: Prisma.$tenant_modulesPayload<ExtArgs>[]
      central_user_index: Prisma.$central_user_indexPayload<ExtArgs>[]
      tenant_branch_links: Prisma.$tenant_branch_linksPayload<ExtArgs>[]
      tenant_pricing_configs: Prisma.$tenant_pricing_configsPayload<ExtArgs> | null
      invoices: Prisma.$invoicesPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      legal_name: string | null
      subdomain: string
      custom_domain: string | null
      logo_url: string | null
      primary_color: string | null
      background_color: string | null
      background_url: string | null
      sitemap_url: string | null
      plan: string
      plan_expires_at: Date | null
      max_employees: number
      db_mode: string
      db_url: string | null
      schema_name: string | null
      local_db_type: string | null
      local_db_host: string | null
      local_db_port: number | null
      local_db_name: string | null
      local_db_user: string | null
      local_db_pass: string | null
      sync_interval_min: number | null
      gstin: string | null
      pan: string | null
      city: string | null
      state: string | null
      address: string | null
      pincode: string | null
      gst_status: string | null
      gst_reg_date: string | null
      taxpayer_type: string | null
      constitution: string | null
      e_invoice_enabled: boolean | null
      business_nature: Prisma.JsonValue | null
      admin_name: string | null
      admin_email: string | null
      admin_phone: string | null
      is_active: boolean
      is_setup_complete: boolean
      suspended_at: Date | null
      suspension_reason: string | null
      payout_config_enc: string | null
      created_at: Date
      updated_at: Date
      deleted_at: Date | null
    }, ExtArgs["result"]["tenants"]>
    composites: {}
  }

  type tenantsGetPayload<S extends boolean | null | undefined | tenantsDefaultArgs> = $Result.GetResult<Prisma.$tenantsPayload, S>

  type tenantsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenantsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TenantsCountAggregateInputType | true
    }

  export interface tenantsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenants'], meta: { name: 'tenants' } }
    /**
     * Find zero or one Tenants that matches the filter.
     * @param {tenantsFindUniqueArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenantsFindUniqueArgs>(args: SelectSubset<T, tenantsFindUniqueArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenants that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenantsFindUniqueOrThrowArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenantsFindUniqueOrThrowArgs>(args: SelectSubset<T, tenantsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindFirstArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenantsFindFirstArgs>(args?: SelectSubset<T, tenantsFindFirstArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenants that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindFirstOrThrowArgs} args - Arguments to find a Tenants
     * @example
     * // Get one Tenants
     * const tenants = await prisma.tenants.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenantsFindFirstOrThrowArgs>(args?: SelectSubset<T, tenantsFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenants
     * const tenants = await prisma.tenants.findMany()
     * 
     * // Get first 10 Tenants
     * const tenants = await prisma.tenants.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenantsWithIdOnly = await prisma.tenants.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends tenantsFindManyArgs>(args?: SelectSubset<T, tenantsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenants.
     * @param {tenantsCreateArgs} args - Arguments to create a Tenants.
     * @example
     * // Create one Tenants
     * const Tenants = await prisma.tenants.create({
     *   data: {
     *     // ... data to create a Tenants
     *   }
     * })
     * 
     */
    create<T extends tenantsCreateArgs>(args: SelectSubset<T, tenantsCreateArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenants.
     * @param {tenantsCreateManyArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenants = await prisma.tenants.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenantsCreateManyArgs>(args?: SelectSubset<T, tenantsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenants and returns the data saved in the database.
     * @param {tenantsCreateManyAndReturnArgs} args - Arguments to create many Tenants.
     * @example
     * // Create many Tenants
     * const tenants = await prisma.tenants.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenants and only return the `id`
     * const tenantsWithIdOnly = await prisma.tenants.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenantsCreateManyAndReturnArgs>(args?: SelectSubset<T, tenantsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenants.
     * @param {tenantsDeleteArgs} args - Arguments to delete one Tenants.
     * @example
     * // Delete one Tenants
     * const Tenants = await prisma.tenants.delete({
     *   where: {
     *     // ... filter to delete one Tenants
     *   }
     * })
     * 
     */
    delete<T extends tenantsDeleteArgs>(args: SelectSubset<T, tenantsDeleteArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenants.
     * @param {tenantsUpdateArgs} args - Arguments to update one Tenants.
     * @example
     * // Update one Tenants
     * const tenants = await prisma.tenants.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenantsUpdateArgs>(args: SelectSubset<T, tenantsUpdateArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenants.
     * @param {tenantsDeleteManyArgs} args - Arguments to filter Tenants to delete.
     * @example
     * // Delete a few Tenants
     * const { count } = await prisma.tenants.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenantsDeleteManyArgs>(args?: SelectSubset<T, tenantsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenants
     * const tenants = await prisma.tenants.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenantsUpdateManyArgs>(args: SelectSubset<T, tenantsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenants and returns the data updated in the database.
     * @param {tenantsUpdateManyAndReturnArgs} args - Arguments to update many Tenants.
     * @example
     * // Update many Tenants
     * const tenants = await prisma.tenants.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenants and only return the `id`
     * const tenantsWithIdOnly = await prisma.tenants.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenantsUpdateManyAndReturnArgs>(args: SelectSubset<T, tenantsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenants.
     * @param {tenantsUpsertArgs} args - Arguments to update or create a Tenants.
     * @example
     * // Update or create a Tenants
     * const tenants = await prisma.tenants.upsert({
     *   create: {
     *     // ... data to create a Tenants
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenants we want to update
     *   }
     * })
     */
    upsert<T extends tenantsUpsertArgs>(args: SelectSubset<T, tenantsUpsertArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsCountArgs} args - Arguments to filter Tenants to count.
     * @example
     * // Count the number of Tenants
     * const count = await prisma.tenants.count({
     *   where: {
     *     // ... the filter for the Tenants we want to count
     *   }
     * })
    **/
    count<T extends tenantsCountArgs>(
      args?: Subset<T, tenantsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TenantsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TenantsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TenantsAggregateArgs>(args: Subset<T, TenantsAggregateArgs>): Prisma.PrismaPromise<GetTenantsAggregateType<T>>

    /**
     * Group by Tenants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenantsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenantsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenantsGroupByArgs['orderBy'] }
        : { orderBy?: tenantsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenantsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenantsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenants model
   */
  readonly fields: tenantsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenants.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenantsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant_modules<T extends tenants$tenant_modulesArgs<ExtArgs> = {}>(args?: Subset<T, tenants$tenant_modulesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    central_user_index<T extends tenants$central_user_indexArgs<ExtArgs> = {}>(args?: Subset<T, tenants$central_user_indexArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tenant_branch_links<T extends tenants$tenant_branch_linksArgs<ExtArgs> = {}>(args?: Subset<T, tenants$tenant_branch_linksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tenant_pricing_configs<T extends tenants$tenant_pricing_configsArgs<ExtArgs> = {}>(args?: Subset<T, tenants$tenant_pricing_configsArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    invoices<T extends tenants$invoicesArgs<ExtArgs> = {}>(args?: Subset<T, tenants$invoicesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenants model
   */
  interface tenantsFieldRefs {
    readonly id: FieldRef<"tenants", 'String'>
    readonly name: FieldRef<"tenants", 'String'>
    readonly legal_name: FieldRef<"tenants", 'String'>
    readonly subdomain: FieldRef<"tenants", 'String'>
    readonly custom_domain: FieldRef<"tenants", 'String'>
    readonly logo_url: FieldRef<"tenants", 'String'>
    readonly primary_color: FieldRef<"tenants", 'String'>
    readonly background_color: FieldRef<"tenants", 'String'>
    readonly background_url: FieldRef<"tenants", 'String'>
    readonly sitemap_url: FieldRef<"tenants", 'String'>
    readonly plan: FieldRef<"tenants", 'String'>
    readonly plan_expires_at: FieldRef<"tenants", 'DateTime'>
    readonly max_employees: FieldRef<"tenants", 'Int'>
    readonly db_mode: FieldRef<"tenants", 'String'>
    readonly db_url: FieldRef<"tenants", 'String'>
    readonly schema_name: FieldRef<"tenants", 'String'>
    readonly local_db_type: FieldRef<"tenants", 'String'>
    readonly local_db_host: FieldRef<"tenants", 'String'>
    readonly local_db_port: FieldRef<"tenants", 'Int'>
    readonly local_db_name: FieldRef<"tenants", 'String'>
    readonly local_db_user: FieldRef<"tenants", 'String'>
    readonly local_db_pass: FieldRef<"tenants", 'String'>
    readonly sync_interval_min: FieldRef<"tenants", 'Int'>
    readonly gstin: FieldRef<"tenants", 'String'>
    readonly pan: FieldRef<"tenants", 'String'>
    readonly city: FieldRef<"tenants", 'String'>
    readonly state: FieldRef<"tenants", 'String'>
    readonly address: FieldRef<"tenants", 'String'>
    readonly pincode: FieldRef<"tenants", 'String'>
    readonly gst_status: FieldRef<"tenants", 'String'>
    readonly gst_reg_date: FieldRef<"tenants", 'String'>
    readonly taxpayer_type: FieldRef<"tenants", 'String'>
    readonly constitution: FieldRef<"tenants", 'String'>
    readonly e_invoice_enabled: FieldRef<"tenants", 'Boolean'>
    readonly business_nature: FieldRef<"tenants", 'Json'>
    readonly admin_name: FieldRef<"tenants", 'String'>
    readonly admin_email: FieldRef<"tenants", 'String'>
    readonly admin_phone: FieldRef<"tenants", 'String'>
    readonly is_active: FieldRef<"tenants", 'Boolean'>
    readonly is_setup_complete: FieldRef<"tenants", 'Boolean'>
    readonly suspended_at: FieldRef<"tenants", 'DateTime'>
    readonly suspension_reason: FieldRef<"tenants", 'String'>
    readonly payout_config_enc: FieldRef<"tenants", 'String'>
    readonly created_at: FieldRef<"tenants", 'DateTime'>
    readonly updated_at: FieldRef<"tenants", 'DateTime'>
    readonly deleted_at: FieldRef<"tenants", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * tenants findUnique
   */
  export type tenantsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants findUniqueOrThrow
   */
  export type tenantsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants findFirst
   */
  export type tenantsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenants.
     */
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants findFirstOrThrow
   */
  export type tenantsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenants.
     */
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants findMany
   */
  export type tenantsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter, which tenants to fetch.
     */
    where?: tenantsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenants to fetch.
     */
    orderBy?: tenantsOrderByWithRelationInput | tenantsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenants.
     */
    cursor?: tenantsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenants from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenants.
     */
    skip?: number
    distinct?: TenantsScalarFieldEnum | TenantsScalarFieldEnum[]
  }

  /**
   * tenants create
   */
  export type tenantsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The data needed to create a tenants.
     */
    data: XOR<tenantsCreateInput, tenantsUncheckedCreateInput>
  }

  /**
   * tenants createMany
   */
  export type tenantsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenants.
     */
    data: tenantsCreateManyInput | tenantsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenants createManyAndReturn
   */
  export type tenantsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * The data used to create many tenants.
     */
    data: tenantsCreateManyInput | tenantsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenants update
   */
  export type tenantsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The data needed to update a tenants.
     */
    data: XOR<tenantsUpdateInput, tenantsUncheckedUpdateInput>
    /**
     * Choose, which tenants to update.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants updateMany
   */
  export type tenantsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenants.
     */
    data: XOR<tenantsUpdateManyMutationInput, tenantsUncheckedUpdateManyInput>
    /**
     * Filter which tenants to update
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to update.
     */
    limit?: number
  }

  /**
   * tenants updateManyAndReturn
   */
  export type tenantsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * The data used to update tenants.
     */
    data: XOR<tenantsUpdateManyMutationInput, tenantsUncheckedUpdateManyInput>
    /**
     * Filter which tenants to update
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to update.
     */
    limit?: number
  }

  /**
   * tenants upsert
   */
  export type tenantsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * The filter to search for the tenants to update in case it exists.
     */
    where: tenantsWhereUniqueInput
    /**
     * In case the tenants found by the `where` argument doesn't exist, create a new tenants with this data.
     */
    create: XOR<tenantsCreateInput, tenantsUncheckedCreateInput>
    /**
     * In case the tenants was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenantsUpdateInput, tenantsUncheckedUpdateInput>
  }

  /**
   * tenants delete
   */
  export type tenantsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
    /**
     * Filter which tenants to delete.
     */
    where: tenantsWhereUniqueInput
  }

  /**
   * tenants deleteMany
   */
  export type tenantsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenants to delete
     */
    where?: tenantsWhereInput
    /**
     * Limit how many tenants to delete.
     */
    limit?: number
  }

  /**
   * tenants.tenant_modules
   */
  export type tenants$tenant_modulesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    where?: tenant_modulesWhereInput
    orderBy?: tenant_modulesOrderByWithRelationInput | tenant_modulesOrderByWithRelationInput[]
    cursor?: tenant_modulesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Tenant_modulesScalarFieldEnum | Tenant_modulesScalarFieldEnum[]
  }

  /**
   * tenants.central_user_index
   */
  export type tenants$central_user_indexArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    where?: central_user_indexWhereInput
    orderBy?: central_user_indexOrderByWithRelationInput | central_user_indexOrderByWithRelationInput[]
    cursor?: central_user_indexWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Central_user_indexScalarFieldEnum | Central_user_indexScalarFieldEnum[]
  }

  /**
   * tenants.tenant_branch_links
   */
  export type tenants$tenant_branch_linksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    where?: tenant_branch_linksWhereInput
    orderBy?: tenant_branch_linksOrderByWithRelationInput | tenant_branch_linksOrderByWithRelationInput[]
    cursor?: tenant_branch_linksWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Tenant_branch_linksScalarFieldEnum | Tenant_branch_linksScalarFieldEnum[]
  }

  /**
   * tenants.tenant_pricing_configs
   */
  export type tenants$tenant_pricing_configsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    where?: tenant_pricing_configsWhereInput
  }

  /**
   * tenants.invoices
   */
  export type tenants$invoicesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    where?: invoicesWhereInput
    orderBy?: invoicesOrderByWithRelationInput | invoicesOrderByWithRelationInput[]
    cursor?: invoicesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InvoicesScalarFieldEnum | InvoicesScalarFieldEnum[]
  }

  /**
   * tenants without action
   */
  export type tenantsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenants
     */
    select?: tenantsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenants
     */
    omit?: tenantsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenantsInclude<ExtArgs> | null
  }


  /**
   * Model tenant_modules
   */

  export type AggregateTenant_modules = {
    _count: Tenant_modulesCountAggregateOutputType | null
    _avg: Tenant_modulesAvgAggregateOutputType | null
    _sum: Tenant_modulesSumAggregateOutputType | null
    _min: Tenant_modulesMinAggregateOutputType | null
    _max: Tenant_modulesMaxAggregateOutputType | null
  }

  export type Tenant_modulesAvgAggregateOutputType = {
    custom_price_paise: number | null
  }

  export type Tenant_modulesSumAggregateOutputType = {
    custom_price_paise: number | null
  }

  export type Tenant_modulesMinAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    module_name: string | null
    is_active: boolean | null
    custom_price_paise: number | null
    enabled_at: Date | null
    disabled_at: Date | null
  }

  export type Tenant_modulesMaxAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    module_name: string | null
    is_active: boolean | null
    custom_price_paise: number | null
    enabled_at: Date | null
    disabled_at: Date | null
  }

  export type Tenant_modulesCountAggregateOutputType = {
    id: number
    tenant_id: number
    module_name: number
    is_active: number
    custom_price_paise: number
    enabled_at: number
    disabled_at: number
    _all: number
  }


  export type Tenant_modulesAvgAggregateInputType = {
    custom_price_paise?: true
  }

  export type Tenant_modulesSumAggregateInputType = {
    custom_price_paise?: true
  }

  export type Tenant_modulesMinAggregateInputType = {
    id?: true
    tenant_id?: true
    module_name?: true
    is_active?: true
    custom_price_paise?: true
    enabled_at?: true
    disabled_at?: true
  }

  export type Tenant_modulesMaxAggregateInputType = {
    id?: true
    tenant_id?: true
    module_name?: true
    is_active?: true
    custom_price_paise?: true
    enabled_at?: true
    disabled_at?: true
  }

  export type Tenant_modulesCountAggregateInputType = {
    id?: true
    tenant_id?: true
    module_name?: true
    is_active?: true
    custom_price_paise?: true
    enabled_at?: true
    disabled_at?: true
    _all?: true
  }

  export type Tenant_modulesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_modules to aggregate.
     */
    where?: tenant_modulesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_modules to fetch.
     */
    orderBy?: tenant_modulesOrderByWithRelationInput | tenant_modulesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenant_modulesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_modules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_modules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenant_modules
    **/
    _count?: true | Tenant_modulesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Tenant_modulesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Tenant_modulesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Tenant_modulesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Tenant_modulesMaxAggregateInputType
  }

  export type GetTenant_modulesAggregateType<T extends Tenant_modulesAggregateArgs> = {
        [P in keyof T & keyof AggregateTenant_modules]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenant_modules[P]>
      : GetScalarType<T[P], AggregateTenant_modules[P]>
  }



  export type tenant_modulesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_modulesWhereInput
    orderBy?: tenant_modulesOrderByWithAggregationInput | tenant_modulesOrderByWithAggregationInput[]
    by: Tenant_modulesScalarFieldEnum[] | Tenant_modulesScalarFieldEnum
    having?: tenant_modulesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Tenant_modulesCountAggregateInputType | true
    _avg?: Tenant_modulesAvgAggregateInputType
    _sum?: Tenant_modulesSumAggregateInputType
    _min?: Tenant_modulesMinAggregateInputType
    _max?: Tenant_modulesMaxAggregateInputType
  }

  export type Tenant_modulesGroupByOutputType = {
    id: string
    tenant_id: string
    module_name: string
    is_active: boolean
    custom_price_paise: number | null
    enabled_at: Date | null
    disabled_at: Date | null
    _count: Tenant_modulesCountAggregateOutputType | null
    _avg: Tenant_modulesAvgAggregateOutputType | null
    _sum: Tenant_modulesSumAggregateOutputType | null
    _min: Tenant_modulesMinAggregateOutputType | null
    _max: Tenant_modulesMaxAggregateOutputType | null
  }

  type GetTenant_modulesGroupByPayload<T extends tenant_modulesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Tenant_modulesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Tenant_modulesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Tenant_modulesGroupByOutputType[P]>
            : GetScalarType<T[P], Tenant_modulesGroupByOutputType[P]>
        }
      >
    >


  export type tenant_modulesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    module_name?: boolean
    is_active?: boolean
    custom_price_paise?: boolean
    enabled_at?: boolean
    disabled_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_modules"]>

  export type tenant_modulesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    module_name?: boolean
    is_active?: boolean
    custom_price_paise?: boolean
    enabled_at?: boolean
    disabled_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_modules"]>

  export type tenant_modulesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    module_name?: boolean
    is_active?: boolean
    custom_price_paise?: boolean
    enabled_at?: boolean
    disabled_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_modules"]>

  export type tenant_modulesSelectScalar = {
    id?: boolean
    tenant_id?: boolean
    module_name?: boolean
    is_active?: boolean
    custom_price_paise?: boolean
    enabled_at?: boolean
    disabled_at?: boolean
  }

  export type tenant_modulesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenant_id" | "module_name" | "is_active" | "custom_price_paise" | "enabled_at" | "disabled_at", ExtArgs["result"]["tenant_modules"]>
  export type tenant_modulesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_modulesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_modulesIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $tenant_modulesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenant_modules"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenant_id: string
      module_name: string
      is_active: boolean
      custom_price_paise: number | null
      enabled_at: Date | null
      disabled_at: Date | null
    }, ExtArgs["result"]["tenant_modules"]>
    composites: {}
  }

  type tenant_modulesGetPayload<S extends boolean | null | undefined | tenant_modulesDefaultArgs> = $Result.GetResult<Prisma.$tenant_modulesPayload, S>

  type tenant_modulesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenant_modulesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Tenant_modulesCountAggregateInputType | true
    }

  export interface tenant_modulesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenant_modules'], meta: { name: 'tenant_modules' } }
    /**
     * Find zero or one Tenant_modules that matches the filter.
     * @param {tenant_modulesFindUniqueArgs} args - Arguments to find a Tenant_modules
     * @example
     * // Get one Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenant_modulesFindUniqueArgs>(args: SelectSubset<T, tenant_modulesFindUniqueArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenant_modules that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenant_modulesFindUniqueOrThrowArgs} args - Arguments to find a Tenant_modules
     * @example
     * // Get one Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenant_modulesFindUniqueOrThrowArgs>(args: SelectSubset<T, tenant_modulesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_modules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesFindFirstArgs} args - Arguments to find a Tenant_modules
     * @example
     * // Get one Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenant_modulesFindFirstArgs>(args?: SelectSubset<T, tenant_modulesFindFirstArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_modules that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesFindFirstOrThrowArgs} args - Arguments to find a Tenant_modules
     * @example
     * // Get one Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenant_modulesFindFirstOrThrowArgs>(args?: SelectSubset<T, tenant_modulesFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenant_modules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findMany()
     * 
     * // Get first 10 Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenant_modulesWithIdOnly = await prisma.tenant_modules.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends tenant_modulesFindManyArgs>(args?: SelectSubset<T, tenant_modulesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenant_modules.
     * @param {tenant_modulesCreateArgs} args - Arguments to create a Tenant_modules.
     * @example
     * // Create one Tenant_modules
     * const Tenant_modules = await prisma.tenant_modules.create({
     *   data: {
     *     // ... data to create a Tenant_modules
     *   }
     * })
     * 
     */
    create<T extends tenant_modulesCreateArgs>(args: SelectSubset<T, tenant_modulesCreateArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenant_modules.
     * @param {tenant_modulesCreateManyArgs} args - Arguments to create many Tenant_modules.
     * @example
     * // Create many Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenant_modulesCreateManyArgs>(args?: SelectSubset<T, tenant_modulesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenant_modules and returns the data saved in the database.
     * @param {tenant_modulesCreateManyAndReturnArgs} args - Arguments to create many Tenant_modules.
     * @example
     * // Create many Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenant_modules and only return the `id`
     * const tenant_modulesWithIdOnly = await prisma.tenant_modules.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenant_modulesCreateManyAndReturnArgs>(args?: SelectSubset<T, tenant_modulesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenant_modules.
     * @param {tenant_modulesDeleteArgs} args - Arguments to delete one Tenant_modules.
     * @example
     * // Delete one Tenant_modules
     * const Tenant_modules = await prisma.tenant_modules.delete({
     *   where: {
     *     // ... filter to delete one Tenant_modules
     *   }
     * })
     * 
     */
    delete<T extends tenant_modulesDeleteArgs>(args: SelectSubset<T, tenant_modulesDeleteArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenant_modules.
     * @param {tenant_modulesUpdateArgs} args - Arguments to update one Tenant_modules.
     * @example
     * // Update one Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenant_modulesUpdateArgs>(args: SelectSubset<T, tenant_modulesUpdateArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenant_modules.
     * @param {tenant_modulesDeleteManyArgs} args - Arguments to filter Tenant_modules to delete.
     * @example
     * // Delete a few Tenant_modules
     * const { count } = await prisma.tenant_modules.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenant_modulesDeleteManyArgs>(args?: SelectSubset<T, tenant_modulesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_modules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenant_modulesUpdateManyArgs>(args: SelectSubset<T, tenant_modulesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_modules and returns the data updated in the database.
     * @param {tenant_modulesUpdateManyAndReturnArgs} args - Arguments to update many Tenant_modules.
     * @example
     * // Update many Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenant_modules and only return the `id`
     * const tenant_modulesWithIdOnly = await prisma.tenant_modules.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenant_modulesUpdateManyAndReturnArgs>(args: SelectSubset<T, tenant_modulesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenant_modules.
     * @param {tenant_modulesUpsertArgs} args - Arguments to update or create a Tenant_modules.
     * @example
     * // Update or create a Tenant_modules
     * const tenant_modules = await prisma.tenant_modules.upsert({
     *   create: {
     *     // ... data to create a Tenant_modules
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenant_modules we want to update
     *   }
     * })
     */
    upsert<T extends tenant_modulesUpsertArgs>(args: SelectSubset<T, tenant_modulesUpsertArgs<ExtArgs>>): Prisma__tenant_modulesClient<$Result.GetResult<Prisma.$tenant_modulesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenant_modules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesCountArgs} args - Arguments to filter Tenant_modules to count.
     * @example
     * // Count the number of Tenant_modules
     * const count = await prisma.tenant_modules.count({
     *   where: {
     *     // ... the filter for the Tenant_modules we want to count
     *   }
     * })
    **/
    count<T extends tenant_modulesCountArgs>(
      args?: Subset<T, tenant_modulesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Tenant_modulesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenant_modules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Tenant_modulesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Tenant_modulesAggregateArgs>(args: Subset<T, Tenant_modulesAggregateArgs>): Prisma.PrismaPromise<GetTenant_modulesAggregateType<T>>

    /**
     * Group by Tenant_modules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_modulesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenant_modulesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenant_modulesGroupByArgs['orderBy'] }
        : { orderBy?: tenant_modulesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenant_modulesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenant_modulesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenant_modules model
   */
  readonly fields: tenant_modulesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenant_modules.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenant_modulesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenant_modules model
   */
  interface tenant_modulesFieldRefs {
    readonly id: FieldRef<"tenant_modules", 'String'>
    readonly tenant_id: FieldRef<"tenant_modules", 'String'>
    readonly module_name: FieldRef<"tenant_modules", 'String'>
    readonly is_active: FieldRef<"tenant_modules", 'Boolean'>
    readonly custom_price_paise: FieldRef<"tenant_modules", 'Int'>
    readonly enabled_at: FieldRef<"tenant_modules", 'DateTime'>
    readonly disabled_at: FieldRef<"tenant_modules", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * tenant_modules findUnique
   */
  export type tenant_modulesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter, which tenant_modules to fetch.
     */
    where: tenant_modulesWhereUniqueInput
  }

  /**
   * tenant_modules findUniqueOrThrow
   */
  export type tenant_modulesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter, which tenant_modules to fetch.
     */
    where: tenant_modulesWhereUniqueInput
  }

  /**
   * tenant_modules findFirst
   */
  export type tenant_modulesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter, which tenant_modules to fetch.
     */
    where?: tenant_modulesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_modules to fetch.
     */
    orderBy?: tenant_modulesOrderByWithRelationInput | tenant_modulesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_modules.
     */
    cursor?: tenant_modulesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_modules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_modules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_modules.
     */
    distinct?: Tenant_modulesScalarFieldEnum | Tenant_modulesScalarFieldEnum[]
  }

  /**
   * tenant_modules findFirstOrThrow
   */
  export type tenant_modulesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter, which tenant_modules to fetch.
     */
    where?: tenant_modulesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_modules to fetch.
     */
    orderBy?: tenant_modulesOrderByWithRelationInput | tenant_modulesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_modules.
     */
    cursor?: tenant_modulesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_modules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_modules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_modules.
     */
    distinct?: Tenant_modulesScalarFieldEnum | Tenant_modulesScalarFieldEnum[]
  }

  /**
   * tenant_modules findMany
   */
  export type tenant_modulesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter, which tenant_modules to fetch.
     */
    where?: tenant_modulesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_modules to fetch.
     */
    orderBy?: tenant_modulesOrderByWithRelationInput | tenant_modulesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenant_modules.
     */
    cursor?: tenant_modulesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_modules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_modules.
     */
    skip?: number
    distinct?: Tenant_modulesScalarFieldEnum | Tenant_modulesScalarFieldEnum[]
  }

  /**
   * tenant_modules create
   */
  export type tenant_modulesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * The data needed to create a tenant_modules.
     */
    data: XOR<tenant_modulesCreateInput, tenant_modulesUncheckedCreateInput>
  }

  /**
   * tenant_modules createMany
   */
  export type tenant_modulesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenant_modules.
     */
    data: tenant_modulesCreateManyInput | tenant_modulesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenant_modules createManyAndReturn
   */
  export type tenant_modulesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * The data used to create many tenant_modules.
     */
    data: tenant_modulesCreateManyInput | tenant_modulesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_modules update
   */
  export type tenant_modulesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * The data needed to update a tenant_modules.
     */
    data: XOR<tenant_modulesUpdateInput, tenant_modulesUncheckedUpdateInput>
    /**
     * Choose, which tenant_modules to update.
     */
    where: tenant_modulesWhereUniqueInput
  }

  /**
   * tenant_modules updateMany
   */
  export type tenant_modulesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenant_modules.
     */
    data: XOR<tenant_modulesUpdateManyMutationInput, tenant_modulesUncheckedUpdateManyInput>
    /**
     * Filter which tenant_modules to update
     */
    where?: tenant_modulesWhereInput
    /**
     * Limit how many tenant_modules to update.
     */
    limit?: number
  }

  /**
   * tenant_modules updateManyAndReturn
   */
  export type tenant_modulesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * The data used to update tenant_modules.
     */
    data: XOR<tenant_modulesUpdateManyMutationInput, tenant_modulesUncheckedUpdateManyInput>
    /**
     * Filter which tenant_modules to update
     */
    where?: tenant_modulesWhereInput
    /**
     * Limit how many tenant_modules to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_modules upsert
   */
  export type tenant_modulesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * The filter to search for the tenant_modules to update in case it exists.
     */
    where: tenant_modulesWhereUniqueInput
    /**
     * In case the tenant_modules found by the `where` argument doesn't exist, create a new tenant_modules with this data.
     */
    create: XOR<tenant_modulesCreateInput, tenant_modulesUncheckedCreateInput>
    /**
     * In case the tenant_modules was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenant_modulesUpdateInput, tenant_modulesUncheckedUpdateInput>
  }

  /**
   * tenant_modules delete
   */
  export type tenant_modulesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
    /**
     * Filter which tenant_modules to delete.
     */
    where: tenant_modulesWhereUniqueInput
  }

  /**
   * tenant_modules deleteMany
   */
  export type tenant_modulesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_modules to delete
     */
    where?: tenant_modulesWhereInput
    /**
     * Limit how many tenant_modules to delete.
     */
    limit?: number
  }

  /**
   * tenant_modules without action
   */
  export type tenant_modulesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_modules
     */
    select?: tenant_modulesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_modules
     */
    omit?: tenant_modulesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_modulesInclude<ExtArgs> | null
  }


  /**
   * Model central_user_index
   */

  export type AggregateCentral_user_index = {
    _count: Central_user_indexCountAggregateOutputType | null
    _min: Central_user_indexMinAggregateOutputType | null
    _max: Central_user_indexMaxAggregateOutputType | null
  }

  export type Central_user_indexMinAggregateOutputType = {
    id: string | null
    email: string | null
    subdomain: string | null
    company_id: string | null
    user_id: string | null
    is_platform_admin: boolean | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Central_user_indexMaxAggregateOutputType = {
    id: string | null
    email: string | null
    subdomain: string | null
    company_id: string | null
    user_id: string | null
    is_platform_admin: boolean | null
    is_active: boolean | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type Central_user_indexCountAggregateOutputType = {
    id: number
    email: number
    subdomain: number
    company_id: number
    user_id: number
    is_platform_admin: number
    is_active: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type Central_user_indexMinAggregateInputType = {
    id?: true
    email?: true
    subdomain?: true
    company_id?: true
    user_id?: true
    is_platform_admin?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type Central_user_indexMaxAggregateInputType = {
    id?: true
    email?: true
    subdomain?: true
    company_id?: true
    user_id?: true
    is_platform_admin?: true
    is_active?: true
    created_at?: true
    updated_at?: true
  }

  export type Central_user_indexCountAggregateInputType = {
    id?: true
    email?: true
    subdomain?: true
    company_id?: true
    user_id?: true
    is_platform_admin?: true
    is_active?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type Central_user_indexAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_user_index to aggregate.
     */
    where?: central_user_indexWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_user_indices to fetch.
     */
    orderBy?: central_user_indexOrderByWithRelationInput | central_user_indexOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: central_user_indexWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_user_indices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_user_indices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned central_user_indices
    **/
    _count?: true | Central_user_indexCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Central_user_indexMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Central_user_indexMaxAggregateInputType
  }

  export type GetCentral_user_indexAggregateType<T extends Central_user_indexAggregateArgs> = {
        [P in keyof T & keyof AggregateCentral_user_index]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCentral_user_index[P]>
      : GetScalarType<T[P], AggregateCentral_user_index[P]>
  }



  export type central_user_indexGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: central_user_indexWhereInput
    orderBy?: central_user_indexOrderByWithAggregationInput | central_user_indexOrderByWithAggregationInput[]
    by: Central_user_indexScalarFieldEnum[] | Central_user_indexScalarFieldEnum
    having?: central_user_indexScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Central_user_indexCountAggregateInputType | true
    _min?: Central_user_indexMinAggregateInputType
    _max?: Central_user_indexMaxAggregateInputType
  }

  export type Central_user_indexGroupByOutputType = {
    id: string
    email: string
    subdomain: string
    company_id: string
    user_id: string | null
    is_platform_admin: boolean
    is_active: boolean
    created_at: Date
    updated_at: Date
    _count: Central_user_indexCountAggregateOutputType | null
    _min: Central_user_indexMinAggregateOutputType | null
    _max: Central_user_indexMaxAggregateOutputType | null
  }

  type GetCentral_user_indexGroupByPayload<T extends central_user_indexGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Central_user_indexGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Central_user_indexGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Central_user_indexGroupByOutputType[P]>
            : GetScalarType<T[P], Central_user_indexGroupByOutputType[P]>
        }
      >
    >


  export type central_user_indexSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    subdomain?: boolean
    company_id?: boolean
    user_id?: boolean
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["central_user_index"]>

  export type central_user_indexSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    subdomain?: boolean
    company_id?: boolean
    user_id?: boolean
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["central_user_index"]>

  export type central_user_indexSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    subdomain?: boolean
    company_id?: boolean
    user_id?: boolean
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["central_user_index"]>

  export type central_user_indexSelectScalar = {
    id?: boolean
    email?: boolean
    subdomain?: boolean
    company_id?: boolean
    user_id?: boolean
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type central_user_indexOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "subdomain" | "company_id" | "user_id" | "is_platform_admin" | "is_active" | "created_at" | "updated_at", ExtArgs["result"]["central_user_index"]>
  export type central_user_indexInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type central_user_indexIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type central_user_indexIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $central_user_indexPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "central_user_index"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      subdomain: string
      company_id: string
      user_id: string | null
      is_platform_admin: boolean
      is_active: boolean
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["central_user_index"]>
    composites: {}
  }

  type central_user_indexGetPayload<S extends boolean | null | undefined | central_user_indexDefaultArgs> = $Result.GetResult<Prisma.$central_user_indexPayload, S>

  type central_user_indexCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<central_user_indexFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Central_user_indexCountAggregateInputType | true
    }

  export interface central_user_indexDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['central_user_index'], meta: { name: 'central_user_index' } }
    /**
     * Find zero or one Central_user_index that matches the filter.
     * @param {central_user_indexFindUniqueArgs} args - Arguments to find a Central_user_index
     * @example
     * // Get one Central_user_index
     * const central_user_index = await prisma.central_user_index.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends central_user_indexFindUniqueArgs>(args: SelectSubset<T, central_user_indexFindUniqueArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Central_user_index that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {central_user_indexFindUniqueOrThrowArgs} args - Arguments to find a Central_user_index
     * @example
     * // Get one Central_user_index
     * const central_user_index = await prisma.central_user_index.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends central_user_indexFindUniqueOrThrowArgs>(args: SelectSubset<T, central_user_indexFindUniqueOrThrowArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_user_index that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexFindFirstArgs} args - Arguments to find a Central_user_index
     * @example
     * // Get one Central_user_index
     * const central_user_index = await prisma.central_user_index.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends central_user_indexFindFirstArgs>(args?: SelectSubset<T, central_user_indexFindFirstArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_user_index that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexFindFirstOrThrowArgs} args - Arguments to find a Central_user_index
     * @example
     * // Get one Central_user_index
     * const central_user_index = await prisma.central_user_index.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends central_user_indexFindFirstOrThrowArgs>(args?: SelectSubset<T, central_user_indexFindFirstOrThrowArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Central_user_indices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Central_user_indices
     * const central_user_indices = await prisma.central_user_index.findMany()
     * 
     * // Get first 10 Central_user_indices
     * const central_user_indices = await prisma.central_user_index.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const central_user_indexWithIdOnly = await prisma.central_user_index.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends central_user_indexFindManyArgs>(args?: SelectSubset<T, central_user_indexFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Central_user_index.
     * @param {central_user_indexCreateArgs} args - Arguments to create a Central_user_index.
     * @example
     * // Create one Central_user_index
     * const Central_user_index = await prisma.central_user_index.create({
     *   data: {
     *     // ... data to create a Central_user_index
     *   }
     * })
     * 
     */
    create<T extends central_user_indexCreateArgs>(args: SelectSubset<T, central_user_indexCreateArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Central_user_indices.
     * @param {central_user_indexCreateManyArgs} args - Arguments to create many Central_user_indices.
     * @example
     * // Create many Central_user_indices
     * const central_user_index = await prisma.central_user_index.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends central_user_indexCreateManyArgs>(args?: SelectSubset<T, central_user_indexCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Central_user_indices and returns the data saved in the database.
     * @param {central_user_indexCreateManyAndReturnArgs} args - Arguments to create many Central_user_indices.
     * @example
     * // Create many Central_user_indices
     * const central_user_index = await prisma.central_user_index.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Central_user_indices and only return the `id`
     * const central_user_indexWithIdOnly = await prisma.central_user_index.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends central_user_indexCreateManyAndReturnArgs>(args?: SelectSubset<T, central_user_indexCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Central_user_index.
     * @param {central_user_indexDeleteArgs} args - Arguments to delete one Central_user_index.
     * @example
     * // Delete one Central_user_index
     * const Central_user_index = await prisma.central_user_index.delete({
     *   where: {
     *     // ... filter to delete one Central_user_index
     *   }
     * })
     * 
     */
    delete<T extends central_user_indexDeleteArgs>(args: SelectSubset<T, central_user_indexDeleteArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Central_user_index.
     * @param {central_user_indexUpdateArgs} args - Arguments to update one Central_user_index.
     * @example
     * // Update one Central_user_index
     * const central_user_index = await prisma.central_user_index.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends central_user_indexUpdateArgs>(args: SelectSubset<T, central_user_indexUpdateArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Central_user_indices.
     * @param {central_user_indexDeleteManyArgs} args - Arguments to filter Central_user_indices to delete.
     * @example
     * // Delete a few Central_user_indices
     * const { count } = await prisma.central_user_index.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends central_user_indexDeleteManyArgs>(args?: SelectSubset<T, central_user_indexDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_user_indices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Central_user_indices
     * const central_user_index = await prisma.central_user_index.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends central_user_indexUpdateManyArgs>(args: SelectSubset<T, central_user_indexUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_user_indices and returns the data updated in the database.
     * @param {central_user_indexUpdateManyAndReturnArgs} args - Arguments to update many Central_user_indices.
     * @example
     * // Update many Central_user_indices
     * const central_user_index = await prisma.central_user_index.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Central_user_indices and only return the `id`
     * const central_user_indexWithIdOnly = await prisma.central_user_index.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends central_user_indexUpdateManyAndReturnArgs>(args: SelectSubset<T, central_user_indexUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Central_user_index.
     * @param {central_user_indexUpsertArgs} args - Arguments to update or create a Central_user_index.
     * @example
     * // Update or create a Central_user_index
     * const central_user_index = await prisma.central_user_index.upsert({
     *   create: {
     *     // ... data to create a Central_user_index
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Central_user_index we want to update
     *   }
     * })
     */
    upsert<T extends central_user_indexUpsertArgs>(args: SelectSubset<T, central_user_indexUpsertArgs<ExtArgs>>): Prisma__central_user_indexClient<$Result.GetResult<Prisma.$central_user_indexPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Central_user_indices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexCountArgs} args - Arguments to filter Central_user_indices to count.
     * @example
     * // Count the number of Central_user_indices
     * const count = await prisma.central_user_index.count({
     *   where: {
     *     // ... the filter for the Central_user_indices we want to count
     *   }
     * })
    **/
    count<T extends central_user_indexCountArgs>(
      args?: Subset<T, central_user_indexCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Central_user_indexCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Central_user_index.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Central_user_indexAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Central_user_indexAggregateArgs>(args: Subset<T, Central_user_indexAggregateArgs>): Prisma.PrismaPromise<GetCentral_user_indexAggregateType<T>>

    /**
     * Group by Central_user_index.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_user_indexGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends central_user_indexGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: central_user_indexGroupByArgs['orderBy'] }
        : { orderBy?: central_user_indexGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, central_user_indexGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCentral_user_indexGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the central_user_index model
   */
  readonly fields: central_user_indexFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for central_user_index.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__central_user_indexClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the central_user_index model
   */
  interface central_user_indexFieldRefs {
    readonly id: FieldRef<"central_user_index", 'String'>
    readonly email: FieldRef<"central_user_index", 'String'>
    readonly subdomain: FieldRef<"central_user_index", 'String'>
    readonly company_id: FieldRef<"central_user_index", 'String'>
    readonly user_id: FieldRef<"central_user_index", 'String'>
    readonly is_platform_admin: FieldRef<"central_user_index", 'Boolean'>
    readonly is_active: FieldRef<"central_user_index", 'Boolean'>
    readonly created_at: FieldRef<"central_user_index", 'DateTime'>
    readonly updated_at: FieldRef<"central_user_index", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * central_user_index findUnique
   */
  export type central_user_indexFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter, which central_user_index to fetch.
     */
    where: central_user_indexWhereUniqueInput
  }

  /**
   * central_user_index findUniqueOrThrow
   */
  export type central_user_indexFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter, which central_user_index to fetch.
     */
    where: central_user_indexWhereUniqueInput
  }

  /**
   * central_user_index findFirst
   */
  export type central_user_indexFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter, which central_user_index to fetch.
     */
    where?: central_user_indexWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_user_indices to fetch.
     */
    orderBy?: central_user_indexOrderByWithRelationInput | central_user_indexOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_user_indices.
     */
    cursor?: central_user_indexWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_user_indices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_user_indices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_user_indices.
     */
    distinct?: Central_user_indexScalarFieldEnum | Central_user_indexScalarFieldEnum[]
  }

  /**
   * central_user_index findFirstOrThrow
   */
  export type central_user_indexFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter, which central_user_index to fetch.
     */
    where?: central_user_indexWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_user_indices to fetch.
     */
    orderBy?: central_user_indexOrderByWithRelationInput | central_user_indexOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_user_indices.
     */
    cursor?: central_user_indexWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_user_indices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_user_indices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_user_indices.
     */
    distinct?: Central_user_indexScalarFieldEnum | Central_user_indexScalarFieldEnum[]
  }

  /**
   * central_user_index findMany
   */
  export type central_user_indexFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter, which central_user_indices to fetch.
     */
    where?: central_user_indexWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_user_indices to fetch.
     */
    orderBy?: central_user_indexOrderByWithRelationInput | central_user_indexOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing central_user_indices.
     */
    cursor?: central_user_indexWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_user_indices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_user_indices.
     */
    skip?: number
    distinct?: Central_user_indexScalarFieldEnum | Central_user_indexScalarFieldEnum[]
  }

  /**
   * central_user_index create
   */
  export type central_user_indexCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * The data needed to create a central_user_index.
     */
    data: XOR<central_user_indexCreateInput, central_user_indexUncheckedCreateInput>
  }

  /**
   * central_user_index createMany
   */
  export type central_user_indexCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many central_user_indices.
     */
    data: central_user_indexCreateManyInput | central_user_indexCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * central_user_index createManyAndReturn
   */
  export type central_user_indexCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * The data used to create many central_user_indices.
     */
    data: central_user_indexCreateManyInput | central_user_indexCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * central_user_index update
   */
  export type central_user_indexUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * The data needed to update a central_user_index.
     */
    data: XOR<central_user_indexUpdateInput, central_user_indexUncheckedUpdateInput>
    /**
     * Choose, which central_user_index to update.
     */
    where: central_user_indexWhereUniqueInput
  }

  /**
   * central_user_index updateMany
   */
  export type central_user_indexUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update central_user_indices.
     */
    data: XOR<central_user_indexUpdateManyMutationInput, central_user_indexUncheckedUpdateManyInput>
    /**
     * Filter which central_user_indices to update
     */
    where?: central_user_indexWhereInput
    /**
     * Limit how many central_user_indices to update.
     */
    limit?: number
  }

  /**
   * central_user_index updateManyAndReturn
   */
  export type central_user_indexUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * The data used to update central_user_indices.
     */
    data: XOR<central_user_indexUpdateManyMutationInput, central_user_indexUncheckedUpdateManyInput>
    /**
     * Filter which central_user_indices to update
     */
    where?: central_user_indexWhereInput
    /**
     * Limit how many central_user_indices to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * central_user_index upsert
   */
  export type central_user_indexUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * The filter to search for the central_user_index to update in case it exists.
     */
    where: central_user_indexWhereUniqueInput
    /**
     * In case the central_user_index found by the `where` argument doesn't exist, create a new central_user_index with this data.
     */
    create: XOR<central_user_indexCreateInput, central_user_indexUncheckedCreateInput>
    /**
     * In case the central_user_index was found with the provided `where` argument, update it with this data.
     */
    update: XOR<central_user_indexUpdateInput, central_user_indexUncheckedUpdateInput>
  }

  /**
   * central_user_index delete
   */
  export type central_user_indexDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
    /**
     * Filter which central_user_index to delete.
     */
    where: central_user_indexWhereUniqueInput
  }

  /**
   * central_user_index deleteMany
   */
  export type central_user_indexDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_user_indices to delete
     */
    where?: central_user_indexWhereInput
    /**
     * Limit how many central_user_indices to delete.
     */
    limit?: number
  }

  /**
   * central_user_index without action
   */
  export type central_user_indexDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_user_index
     */
    select?: central_user_indexSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_user_index
     */
    omit?: central_user_indexOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: central_user_indexInclude<ExtArgs> | null
  }


  /**
   * Model tenant_branch_links
   */

  export type AggregateTenant_branch_links = {
    _count: Tenant_branch_linksCountAggregateOutputType | null
    _min: Tenant_branch_linksMinAggregateOutputType | null
    _max: Tenant_branch_linksMaxAggregateOutputType | null
  }

  export type Tenant_branch_linksMinAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    gstin: string | null
    pan: string | null
    branch_name: string | null
    branch_no: string | null
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    status: string | null
    requested_at: Date | null
    approved_at: Date | null
    note: string | null
  }

  export type Tenant_branch_linksMaxAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    gstin: string | null
    pan: string | null
    branch_name: string | null
    branch_no: string | null
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    status: string | null
    requested_at: Date | null
    approved_at: Date | null
    note: string | null
  }

  export type Tenant_branch_linksCountAggregateOutputType = {
    id: number
    tenant_id: number
    gstin: number
    pan: number
    branch_name: number
    branch_no: number
    address: number
    city: number
    state: number
    pincode: number
    status: number
    requested_at: number
    approved_at: number
    note: number
    _all: number
  }


  export type Tenant_branch_linksMinAggregateInputType = {
    id?: true
    tenant_id?: true
    gstin?: true
    pan?: true
    branch_name?: true
    branch_no?: true
    address?: true
    city?: true
    state?: true
    pincode?: true
    status?: true
    requested_at?: true
    approved_at?: true
    note?: true
  }

  export type Tenant_branch_linksMaxAggregateInputType = {
    id?: true
    tenant_id?: true
    gstin?: true
    pan?: true
    branch_name?: true
    branch_no?: true
    address?: true
    city?: true
    state?: true
    pincode?: true
    status?: true
    requested_at?: true
    approved_at?: true
    note?: true
  }

  export type Tenant_branch_linksCountAggregateInputType = {
    id?: true
    tenant_id?: true
    gstin?: true
    pan?: true
    branch_name?: true
    branch_no?: true
    address?: true
    city?: true
    state?: true
    pincode?: true
    status?: true
    requested_at?: true
    approved_at?: true
    note?: true
    _all?: true
  }

  export type Tenant_branch_linksAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_branch_links to aggregate.
     */
    where?: tenant_branch_linksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_branch_links to fetch.
     */
    orderBy?: tenant_branch_linksOrderByWithRelationInput | tenant_branch_linksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenant_branch_linksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_branch_links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_branch_links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenant_branch_links
    **/
    _count?: true | Tenant_branch_linksCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Tenant_branch_linksMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Tenant_branch_linksMaxAggregateInputType
  }

  export type GetTenant_branch_linksAggregateType<T extends Tenant_branch_linksAggregateArgs> = {
        [P in keyof T & keyof AggregateTenant_branch_links]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenant_branch_links[P]>
      : GetScalarType<T[P], AggregateTenant_branch_links[P]>
  }



  export type tenant_branch_linksGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_branch_linksWhereInput
    orderBy?: tenant_branch_linksOrderByWithAggregationInput | tenant_branch_linksOrderByWithAggregationInput[]
    by: Tenant_branch_linksScalarFieldEnum[] | Tenant_branch_linksScalarFieldEnum
    having?: tenant_branch_linksScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Tenant_branch_linksCountAggregateInputType | true
    _min?: Tenant_branch_linksMinAggregateInputType
    _max?: Tenant_branch_linksMaxAggregateInputType
  }

  export type Tenant_branch_linksGroupByOutputType = {
    id: string
    tenant_id: string
    gstin: string
    pan: string
    branch_name: string | null
    branch_no: string | null
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    status: string
    requested_at: Date
    approved_at: Date | null
    note: string | null
    _count: Tenant_branch_linksCountAggregateOutputType | null
    _min: Tenant_branch_linksMinAggregateOutputType | null
    _max: Tenant_branch_linksMaxAggregateOutputType | null
  }

  type GetTenant_branch_linksGroupByPayload<T extends tenant_branch_linksGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Tenant_branch_linksGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Tenant_branch_linksGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Tenant_branch_linksGroupByOutputType[P]>
            : GetScalarType<T[P], Tenant_branch_linksGroupByOutputType[P]>
        }
      >
    >


  export type tenant_branch_linksSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    gstin?: boolean
    pan?: boolean
    branch_name?: boolean
    branch_no?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    pincode?: boolean
    status?: boolean
    requested_at?: boolean
    approved_at?: boolean
    note?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_branch_links"]>

  export type tenant_branch_linksSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    gstin?: boolean
    pan?: boolean
    branch_name?: boolean
    branch_no?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    pincode?: boolean
    status?: boolean
    requested_at?: boolean
    approved_at?: boolean
    note?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_branch_links"]>

  export type tenant_branch_linksSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    gstin?: boolean
    pan?: boolean
    branch_name?: boolean
    branch_no?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    pincode?: boolean
    status?: boolean
    requested_at?: boolean
    approved_at?: boolean
    note?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_branch_links"]>

  export type tenant_branch_linksSelectScalar = {
    id?: boolean
    tenant_id?: boolean
    gstin?: boolean
    pan?: boolean
    branch_name?: boolean
    branch_no?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    pincode?: boolean
    status?: boolean
    requested_at?: boolean
    approved_at?: boolean
    note?: boolean
  }

  export type tenant_branch_linksOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenant_id" | "gstin" | "pan" | "branch_name" | "branch_no" | "address" | "city" | "state" | "pincode" | "status" | "requested_at" | "approved_at" | "note", ExtArgs["result"]["tenant_branch_links"]>
  export type tenant_branch_linksInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_branch_linksIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_branch_linksIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $tenant_branch_linksPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenant_branch_links"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenant_id: string
      gstin: string
      pan: string
      branch_name: string | null
      branch_no: string | null
      address: string | null
      city: string | null
      state: string | null
      pincode: string | null
      status: string
      requested_at: Date
      approved_at: Date | null
      note: string | null
    }, ExtArgs["result"]["tenant_branch_links"]>
    composites: {}
  }

  type tenant_branch_linksGetPayload<S extends boolean | null | undefined | tenant_branch_linksDefaultArgs> = $Result.GetResult<Prisma.$tenant_branch_linksPayload, S>

  type tenant_branch_linksCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenant_branch_linksFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Tenant_branch_linksCountAggregateInputType | true
    }

  export interface tenant_branch_linksDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenant_branch_links'], meta: { name: 'tenant_branch_links' } }
    /**
     * Find zero or one Tenant_branch_links that matches the filter.
     * @param {tenant_branch_linksFindUniqueArgs} args - Arguments to find a Tenant_branch_links
     * @example
     * // Get one Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenant_branch_linksFindUniqueArgs>(args: SelectSubset<T, tenant_branch_linksFindUniqueArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenant_branch_links that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenant_branch_linksFindUniqueOrThrowArgs} args - Arguments to find a Tenant_branch_links
     * @example
     * // Get one Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenant_branch_linksFindUniqueOrThrowArgs>(args: SelectSubset<T, tenant_branch_linksFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_branch_links that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksFindFirstArgs} args - Arguments to find a Tenant_branch_links
     * @example
     * // Get one Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenant_branch_linksFindFirstArgs>(args?: SelectSubset<T, tenant_branch_linksFindFirstArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_branch_links that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksFindFirstOrThrowArgs} args - Arguments to find a Tenant_branch_links
     * @example
     * // Get one Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenant_branch_linksFindFirstOrThrowArgs>(args?: SelectSubset<T, tenant_branch_linksFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenant_branch_links that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findMany()
     * 
     * // Get first 10 Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenant_branch_linksWithIdOnly = await prisma.tenant_branch_links.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends tenant_branch_linksFindManyArgs>(args?: SelectSubset<T, tenant_branch_linksFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenant_branch_links.
     * @param {tenant_branch_linksCreateArgs} args - Arguments to create a Tenant_branch_links.
     * @example
     * // Create one Tenant_branch_links
     * const Tenant_branch_links = await prisma.tenant_branch_links.create({
     *   data: {
     *     // ... data to create a Tenant_branch_links
     *   }
     * })
     * 
     */
    create<T extends tenant_branch_linksCreateArgs>(args: SelectSubset<T, tenant_branch_linksCreateArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenant_branch_links.
     * @param {tenant_branch_linksCreateManyArgs} args - Arguments to create many Tenant_branch_links.
     * @example
     * // Create many Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenant_branch_linksCreateManyArgs>(args?: SelectSubset<T, tenant_branch_linksCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenant_branch_links and returns the data saved in the database.
     * @param {tenant_branch_linksCreateManyAndReturnArgs} args - Arguments to create many Tenant_branch_links.
     * @example
     * // Create many Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenant_branch_links and only return the `id`
     * const tenant_branch_linksWithIdOnly = await prisma.tenant_branch_links.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenant_branch_linksCreateManyAndReturnArgs>(args?: SelectSubset<T, tenant_branch_linksCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenant_branch_links.
     * @param {tenant_branch_linksDeleteArgs} args - Arguments to delete one Tenant_branch_links.
     * @example
     * // Delete one Tenant_branch_links
     * const Tenant_branch_links = await prisma.tenant_branch_links.delete({
     *   where: {
     *     // ... filter to delete one Tenant_branch_links
     *   }
     * })
     * 
     */
    delete<T extends tenant_branch_linksDeleteArgs>(args: SelectSubset<T, tenant_branch_linksDeleteArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenant_branch_links.
     * @param {tenant_branch_linksUpdateArgs} args - Arguments to update one Tenant_branch_links.
     * @example
     * // Update one Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenant_branch_linksUpdateArgs>(args: SelectSubset<T, tenant_branch_linksUpdateArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenant_branch_links.
     * @param {tenant_branch_linksDeleteManyArgs} args - Arguments to filter Tenant_branch_links to delete.
     * @example
     * // Delete a few Tenant_branch_links
     * const { count } = await prisma.tenant_branch_links.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenant_branch_linksDeleteManyArgs>(args?: SelectSubset<T, tenant_branch_linksDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_branch_links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenant_branch_linksUpdateManyArgs>(args: SelectSubset<T, tenant_branch_linksUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_branch_links and returns the data updated in the database.
     * @param {tenant_branch_linksUpdateManyAndReturnArgs} args - Arguments to update many Tenant_branch_links.
     * @example
     * // Update many Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenant_branch_links and only return the `id`
     * const tenant_branch_linksWithIdOnly = await prisma.tenant_branch_links.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenant_branch_linksUpdateManyAndReturnArgs>(args: SelectSubset<T, tenant_branch_linksUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenant_branch_links.
     * @param {tenant_branch_linksUpsertArgs} args - Arguments to update or create a Tenant_branch_links.
     * @example
     * // Update or create a Tenant_branch_links
     * const tenant_branch_links = await prisma.tenant_branch_links.upsert({
     *   create: {
     *     // ... data to create a Tenant_branch_links
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenant_branch_links we want to update
     *   }
     * })
     */
    upsert<T extends tenant_branch_linksUpsertArgs>(args: SelectSubset<T, tenant_branch_linksUpsertArgs<ExtArgs>>): Prisma__tenant_branch_linksClient<$Result.GetResult<Prisma.$tenant_branch_linksPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenant_branch_links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksCountArgs} args - Arguments to filter Tenant_branch_links to count.
     * @example
     * // Count the number of Tenant_branch_links
     * const count = await prisma.tenant_branch_links.count({
     *   where: {
     *     // ... the filter for the Tenant_branch_links we want to count
     *   }
     * })
    **/
    count<T extends tenant_branch_linksCountArgs>(
      args?: Subset<T, tenant_branch_linksCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Tenant_branch_linksCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenant_branch_links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Tenant_branch_linksAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Tenant_branch_linksAggregateArgs>(args: Subset<T, Tenant_branch_linksAggregateArgs>): Prisma.PrismaPromise<GetTenant_branch_linksAggregateType<T>>

    /**
     * Group by Tenant_branch_links.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_branch_linksGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenant_branch_linksGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenant_branch_linksGroupByArgs['orderBy'] }
        : { orderBy?: tenant_branch_linksGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenant_branch_linksGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenant_branch_linksGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenant_branch_links model
   */
  readonly fields: tenant_branch_linksFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenant_branch_links.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenant_branch_linksClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenant_branch_links model
   */
  interface tenant_branch_linksFieldRefs {
    readonly id: FieldRef<"tenant_branch_links", 'String'>
    readonly tenant_id: FieldRef<"tenant_branch_links", 'String'>
    readonly gstin: FieldRef<"tenant_branch_links", 'String'>
    readonly pan: FieldRef<"tenant_branch_links", 'String'>
    readonly branch_name: FieldRef<"tenant_branch_links", 'String'>
    readonly branch_no: FieldRef<"tenant_branch_links", 'String'>
    readonly address: FieldRef<"tenant_branch_links", 'String'>
    readonly city: FieldRef<"tenant_branch_links", 'String'>
    readonly state: FieldRef<"tenant_branch_links", 'String'>
    readonly pincode: FieldRef<"tenant_branch_links", 'String'>
    readonly status: FieldRef<"tenant_branch_links", 'String'>
    readonly requested_at: FieldRef<"tenant_branch_links", 'DateTime'>
    readonly approved_at: FieldRef<"tenant_branch_links", 'DateTime'>
    readonly note: FieldRef<"tenant_branch_links", 'String'>
  }
    

  // Custom InputTypes
  /**
   * tenant_branch_links findUnique
   */
  export type tenant_branch_linksFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter, which tenant_branch_links to fetch.
     */
    where: tenant_branch_linksWhereUniqueInput
  }

  /**
   * tenant_branch_links findUniqueOrThrow
   */
  export type tenant_branch_linksFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter, which tenant_branch_links to fetch.
     */
    where: tenant_branch_linksWhereUniqueInput
  }

  /**
   * tenant_branch_links findFirst
   */
  export type tenant_branch_linksFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter, which tenant_branch_links to fetch.
     */
    where?: tenant_branch_linksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_branch_links to fetch.
     */
    orderBy?: tenant_branch_linksOrderByWithRelationInput | tenant_branch_linksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_branch_links.
     */
    cursor?: tenant_branch_linksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_branch_links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_branch_links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_branch_links.
     */
    distinct?: Tenant_branch_linksScalarFieldEnum | Tenant_branch_linksScalarFieldEnum[]
  }

  /**
   * tenant_branch_links findFirstOrThrow
   */
  export type tenant_branch_linksFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter, which tenant_branch_links to fetch.
     */
    where?: tenant_branch_linksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_branch_links to fetch.
     */
    orderBy?: tenant_branch_linksOrderByWithRelationInput | tenant_branch_linksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_branch_links.
     */
    cursor?: tenant_branch_linksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_branch_links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_branch_links.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_branch_links.
     */
    distinct?: Tenant_branch_linksScalarFieldEnum | Tenant_branch_linksScalarFieldEnum[]
  }

  /**
   * tenant_branch_links findMany
   */
  export type tenant_branch_linksFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter, which tenant_branch_links to fetch.
     */
    where?: tenant_branch_linksWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_branch_links to fetch.
     */
    orderBy?: tenant_branch_linksOrderByWithRelationInput | tenant_branch_linksOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenant_branch_links.
     */
    cursor?: tenant_branch_linksWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_branch_links from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_branch_links.
     */
    skip?: number
    distinct?: Tenant_branch_linksScalarFieldEnum | Tenant_branch_linksScalarFieldEnum[]
  }

  /**
   * tenant_branch_links create
   */
  export type tenant_branch_linksCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * The data needed to create a tenant_branch_links.
     */
    data: XOR<tenant_branch_linksCreateInput, tenant_branch_linksUncheckedCreateInput>
  }

  /**
   * tenant_branch_links createMany
   */
  export type tenant_branch_linksCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenant_branch_links.
     */
    data: tenant_branch_linksCreateManyInput | tenant_branch_linksCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenant_branch_links createManyAndReturn
   */
  export type tenant_branch_linksCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * The data used to create many tenant_branch_links.
     */
    data: tenant_branch_linksCreateManyInput | tenant_branch_linksCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_branch_links update
   */
  export type tenant_branch_linksUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * The data needed to update a tenant_branch_links.
     */
    data: XOR<tenant_branch_linksUpdateInput, tenant_branch_linksUncheckedUpdateInput>
    /**
     * Choose, which tenant_branch_links to update.
     */
    where: tenant_branch_linksWhereUniqueInput
  }

  /**
   * tenant_branch_links updateMany
   */
  export type tenant_branch_linksUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenant_branch_links.
     */
    data: XOR<tenant_branch_linksUpdateManyMutationInput, tenant_branch_linksUncheckedUpdateManyInput>
    /**
     * Filter which tenant_branch_links to update
     */
    where?: tenant_branch_linksWhereInput
    /**
     * Limit how many tenant_branch_links to update.
     */
    limit?: number
  }

  /**
   * tenant_branch_links updateManyAndReturn
   */
  export type tenant_branch_linksUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * The data used to update tenant_branch_links.
     */
    data: XOR<tenant_branch_linksUpdateManyMutationInput, tenant_branch_linksUncheckedUpdateManyInput>
    /**
     * Filter which tenant_branch_links to update
     */
    where?: tenant_branch_linksWhereInput
    /**
     * Limit how many tenant_branch_links to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_branch_links upsert
   */
  export type tenant_branch_linksUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * The filter to search for the tenant_branch_links to update in case it exists.
     */
    where: tenant_branch_linksWhereUniqueInput
    /**
     * In case the tenant_branch_links found by the `where` argument doesn't exist, create a new tenant_branch_links with this data.
     */
    create: XOR<tenant_branch_linksCreateInput, tenant_branch_linksUncheckedCreateInput>
    /**
     * In case the tenant_branch_links was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenant_branch_linksUpdateInput, tenant_branch_linksUncheckedUpdateInput>
  }

  /**
   * tenant_branch_links delete
   */
  export type tenant_branch_linksDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
    /**
     * Filter which tenant_branch_links to delete.
     */
    where: tenant_branch_linksWhereUniqueInput
  }

  /**
   * tenant_branch_links deleteMany
   */
  export type tenant_branch_linksDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_branch_links to delete
     */
    where?: tenant_branch_linksWhereInput
    /**
     * Limit how many tenant_branch_links to delete.
     */
    limit?: number
  }

  /**
   * tenant_branch_links without action
   */
  export type tenant_branch_linksDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_branch_links
     */
    select?: tenant_branch_linksSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_branch_links
     */
    omit?: tenant_branch_linksOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_branch_linksInclude<ExtArgs> | null
  }


  /**
   * Model central_kyc_records
   */

  export type AggregateCentral_kyc_records = {
    _count: Central_kyc_recordsCountAggregateOutputType | null
    _min: Central_kyc_recordsMinAggregateOutputType | null
    _max: Central_kyc_recordsMaxAggregateOutputType | null
  }

  export type Central_kyc_recordsMinAggregateOutputType = {
    id: string | null
    aadhaar_hash: string | null
    method: string | null
    kyc_timestamp: Date | null
    name: string | null
    dob: string | null
    gender: string | null
    careof: string | null
    mobile_encrypted: string | null
    email_encrypted: string | null
    house: string | null
    street: string | null
    loc: string | null
    vtc: string | null
    po: string | null
    subdist: string | null
    dist: string | null
    state: string | null
    country: string | null
    pc: string | null
    pht: string | null
    task_id: string | null
    created_at: Date | null
  }

  export type Central_kyc_recordsMaxAggregateOutputType = {
    id: string | null
    aadhaar_hash: string | null
    method: string | null
    kyc_timestamp: Date | null
    name: string | null
    dob: string | null
    gender: string | null
    careof: string | null
    mobile_encrypted: string | null
    email_encrypted: string | null
    house: string | null
    street: string | null
    loc: string | null
    vtc: string | null
    po: string | null
    subdist: string | null
    dist: string | null
    state: string | null
    country: string | null
    pc: string | null
    pht: string | null
    task_id: string | null
    created_at: Date | null
  }

  export type Central_kyc_recordsCountAggregateOutputType = {
    id: number
    aadhaar_hash: number
    method: number
    kyc_timestamp: number
    name: number
    dob: number
    gender: number
    careof: number
    mobile_encrypted: number
    email_encrypted: number
    house: number
    street: number
    loc: number
    vtc: number
    po: number
    subdist: number
    dist: number
    state: number
    country: number
    pc: number
    pht: number
    task_id: number
    created_at: number
    _all: number
  }


  export type Central_kyc_recordsMinAggregateInputType = {
    id?: true
    aadhaar_hash?: true
    method?: true
    kyc_timestamp?: true
    name?: true
    dob?: true
    gender?: true
    careof?: true
    mobile_encrypted?: true
    email_encrypted?: true
    house?: true
    street?: true
    loc?: true
    vtc?: true
    po?: true
    subdist?: true
    dist?: true
    state?: true
    country?: true
    pc?: true
    pht?: true
    task_id?: true
    created_at?: true
  }

  export type Central_kyc_recordsMaxAggregateInputType = {
    id?: true
    aadhaar_hash?: true
    method?: true
    kyc_timestamp?: true
    name?: true
    dob?: true
    gender?: true
    careof?: true
    mobile_encrypted?: true
    email_encrypted?: true
    house?: true
    street?: true
    loc?: true
    vtc?: true
    po?: true
    subdist?: true
    dist?: true
    state?: true
    country?: true
    pc?: true
    pht?: true
    task_id?: true
    created_at?: true
  }

  export type Central_kyc_recordsCountAggregateInputType = {
    id?: true
    aadhaar_hash?: true
    method?: true
    kyc_timestamp?: true
    name?: true
    dob?: true
    gender?: true
    careof?: true
    mobile_encrypted?: true
    email_encrypted?: true
    house?: true
    street?: true
    loc?: true
    vtc?: true
    po?: true
    subdist?: true
    dist?: true
    state?: true
    country?: true
    pc?: true
    pht?: true
    task_id?: true
    created_at?: true
    _all?: true
  }

  export type Central_kyc_recordsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_kyc_records to aggregate.
     */
    where?: central_kyc_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_kyc_records to fetch.
     */
    orderBy?: central_kyc_recordsOrderByWithRelationInput | central_kyc_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: central_kyc_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_kyc_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_kyc_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned central_kyc_records
    **/
    _count?: true | Central_kyc_recordsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Central_kyc_recordsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Central_kyc_recordsMaxAggregateInputType
  }

  export type GetCentral_kyc_recordsAggregateType<T extends Central_kyc_recordsAggregateArgs> = {
        [P in keyof T & keyof AggregateCentral_kyc_records]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCentral_kyc_records[P]>
      : GetScalarType<T[P], AggregateCentral_kyc_records[P]>
  }



  export type central_kyc_recordsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: central_kyc_recordsWhereInput
    orderBy?: central_kyc_recordsOrderByWithAggregationInput | central_kyc_recordsOrderByWithAggregationInput[]
    by: Central_kyc_recordsScalarFieldEnum[] | Central_kyc_recordsScalarFieldEnum
    having?: central_kyc_recordsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Central_kyc_recordsCountAggregateInputType | true
    _min?: Central_kyc_recordsMinAggregateInputType
    _max?: Central_kyc_recordsMaxAggregateInputType
  }

  export type Central_kyc_recordsGroupByOutputType = {
    id: string
    aadhaar_hash: string
    method: string
    kyc_timestamp: Date | null
    name: string | null
    dob: string | null
    gender: string | null
    careof: string | null
    mobile_encrypted: string | null
    email_encrypted: string | null
    house: string | null
    street: string | null
    loc: string | null
    vtc: string | null
    po: string | null
    subdist: string | null
    dist: string | null
    state: string | null
    country: string | null
    pc: string | null
    pht: string | null
    task_id: string | null
    created_at: Date
    _count: Central_kyc_recordsCountAggregateOutputType | null
    _min: Central_kyc_recordsMinAggregateOutputType | null
    _max: Central_kyc_recordsMaxAggregateOutputType | null
  }

  type GetCentral_kyc_recordsGroupByPayload<T extends central_kyc_recordsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Central_kyc_recordsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Central_kyc_recordsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Central_kyc_recordsGroupByOutputType[P]>
            : GetScalarType<T[P], Central_kyc_recordsGroupByOutputType[P]>
        }
      >
    >


  export type central_kyc_recordsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aadhaar_hash?: boolean
    method?: boolean
    kyc_timestamp?: boolean
    name?: boolean
    dob?: boolean
    gender?: boolean
    careof?: boolean
    mobile_encrypted?: boolean
    email_encrypted?: boolean
    house?: boolean
    street?: boolean
    loc?: boolean
    vtc?: boolean
    po?: boolean
    subdist?: boolean
    dist?: boolean
    state?: boolean
    country?: boolean
    pc?: boolean
    pht?: boolean
    task_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_kyc_records"]>

  export type central_kyc_recordsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aadhaar_hash?: boolean
    method?: boolean
    kyc_timestamp?: boolean
    name?: boolean
    dob?: boolean
    gender?: boolean
    careof?: boolean
    mobile_encrypted?: boolean
    email_encrypted?: boolean
    house?: boolean
    street?: boolean
    loc?: boolean
    vtc?: boolean
    po?: boolean
    subdist?: boolean
    dist?: boolean
    state?: boolean
    country?: boolean
    pc?: boolean
    pht?: boolean
    task_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_kyc_records"]>

  export type central_kyc_recordsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aadhaar_hash?: boolean
    method?: boolean
    kyc_timestamp?: boolean
    name?: boolean
    dob?: boolean
    gender?: boolean
    careof?: boolean
    mobile_encrypted?: boolean
    email_encrypted?: boolean
    house?: boolean
    street?: boolean
    loc?: boolean
    vtc?: boolean
    po?: boolean
    subdist?: boolean
    dist?: boolean
    state?: boolean
    country?: boolean
    pc?: boolean
    pht?: boolean
    task_id?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_kyc_records"]>

  export type central_kyc_recordsSelectScalar = {
    id?: boolean
    aadhaar_hash?: boolean
    method?: boolean
    kyc_timestamp?: boolean
    name?: boolean
    dob?: boolean
    gender?: boolean
    careof?: boolean
    mobile_encrypted?: boolean
    email_encrypted?: boolean
    house?: boolean
    street?: boolean
    loc?: boolean
    vtc?: boolean
    po?: boolean
    subdist?: boolean
    dist?: boolean
    state?: boolean
    country?: boolean
    pc?: boolean
    pht?: boolean
    task_id?: boolean
    created_at?: boolean
  }

  export type central_kyc_recordsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "aadhaar_hash" | "method" | "kyc_timestamp" | "name" | "dob" | "gender" | "careof" | "mobile_encrypted" | "email_encrypted" | "house" | "street" | "loc" | "vtc" | "po" | "subdist" | "dist" | "state" | "country" | "pc" | "pht" | "task_id" | "created_at", ExtArgs["result"]["central_kyc_records"]>

  export type $central_kyc_recordsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "central_kyc_records"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      aadhaar_hash: string
      method: string
      kyc_timestamp: Date | null
      name: string | null
      dob: string | null
      gender: string | null
      careof: string | null
      mobile_encrypted: string | null
      email_encrypted: string | null
      house: string | null
      street: string | null
      loc: string | null
      vtc: string | null
      po: string | null
      subdist: string | null
      dist: string | null
      state: string | null
      country: string | null
      pc: string | null
      pht: string | null
      task_id: string | null
      created_at: Date
    }, ExtArgs["result"]["central_kyc_records"]>
    composites: {}
  }

  type central_kyc_recordsGetPayload<S extends boolean | null | undefined | central_kyc_recordsDefaultArgs> = $Result.GetResult<Prisma.$central_kyc_recordsPayload, S>

  type central_kyc_recordsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<central_kyc_recordsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Central_kyc_recordsCountAggregateInputType | true
    }

  export interface central_kyc_recordsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['central_kyc_records'], meta: { name: 'central_kyc_records' } }
    /**
     * Find zero or one Central_kyc_records that matches the filter.
     * @param {central_kyc_recordsFindUniqueArgs} args - Arguments to find a Central_kyc_records
     * @example
     * // Get one Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends central_kyc_recordsFindUniqueArgs>(args: SelectSubset<T, central_kyc_recordsFindUniqueArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Central_kyc_records that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {central_kyc_recordsFindUniqueOrThrowArgs} args - Arguments to find a Central_kyc_records
     * @example
     * // Get one Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends central_kyc_recordsFindUniqueOrThrowArgs>(args: SelectSubset<T, central_kyc_recordsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_kyc_records that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsFindFirstArgs} args - Arguments to find a Central_kyc_records
     * @example
     * // Get one Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends central_kyc_recordsFindFirstArgs>(args?: SelectSubset<T, central_kyc_recordsFindFirstArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_kyc_records that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsFindFirstOrThrowArgs} args - Arguments to find a Central_kyc_records
     * @example
     * // Get one Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends central_kyc_recordsFindFirstOrThrowArgs>(args?: SelectSubset<T, central_kyc_recordsFindFirstOrThrowArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Central_kyc_records that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findMany()
     * 
     * // Get first 10 Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const central_kyc_recordsWithIdOnly = await prisma.central_kyc_records.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends central_kyc_recordsFindManyArgs>(args?: SelectSubset<T, central_kyc_recordsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Central_kyc_records.
     * @param {central_kyc_recordsCreateArgs} args - Arguments to create a Central_kyc_records.
     * @example
     * // Create one Central_kyc_records
     * const Central_kyc_records = await prisma.central_kyc_records.create({
     *   data: {
     *     // ... data to create a Central_kyc_records
     *   }
     * })
     * 
     */
    create<T extends central_kyc_recordsCreateArgs>(args: SelectSubset<T, central_kyc_recordsCreateArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Central_kyc_records.
     * @param {central_kyc_recordsCreateManyArgs} args - Arguments to create many Central_kyc_records.
     * @example
     * // Create many Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends central_kyc_recordsCreateManyArgs>(args?: SelectSubset<T, central_kyc_recordsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Central_kyc_records and returns the data saved in the database.
     * @param {central_kyc_recordsCreateManyAndReturnArgs} args - Arguments to create many Central_kyc_records.
     * @example
     * // Create many Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Central_kyc_records and only return the `id`
     * const central_kyc_recordsWithIdOnly = await prisma.central_kyc_records.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends central_kyc_recordsCreateManyAndReturnArgs>(args?: SelectSubset<T, central_kyc_recordsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Central_kyc_records.
     * @param {central_kyc_recordsDeleteArgs} args - Arguments to delete one Central_kyc_records.
     * @example
     * // Delete one Central_kyc_records
     * const Central_kyc_records = await prisma.central_kyc_records.delete({
     *   where: {
     *     // ... filter to delete one Central_kyc_records
     *   }
     * })
     * 
     */
    delete<T extends central_kyc_recordsDeleteArgs>(args: SelectSubset<T, central_kyc_recordsDeleteArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Central_kyc_records.
     * @param {central_kyc_recordsUpdateArgs} args - Arguments to update one Central_kyc_records.
     * @example
     * // Update one Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends central_kyc_recordsUpdateArgs>(args: SelectSubset<T, central_kyc_recordsUpdateArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Central_kyc_records.
     * @param {central_kyc_recordsDeleteManyArgs} args - Arguments to filter Central_kyc_records to delete.
     * @example
     * // Delete a few Central_kyc_records
     * const { count } = await prisma.central_kyc_records.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends central_kyc_recordsDeleteManyArgs>(args?: SelectSubset<T, central_kyc_recordsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_kyc_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends central_kyc_recordsUpdateManyArgs>(args: SelectSubset<T, central_kyc_recordsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_kyc_records and returns the data updated in the database.
     * @param {central_kyc_recordsUpdateManyAndReturnArgs} args - Arguments to update many Central_kyc_records.
     * @example
     * // Update many Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Central_kyc_records and only return the `id`
     * const central_kyc_recordsWithIdOnly = await prisma.central_kyc_records.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends central_kyc_recordsUpdateManyAndReturnArgs>(args: SelectSubset<T, central_kyc_recordsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Central_kyc_records.
     * @param {central_kyc_recordsUpsertArgs} args - Arguments to update or create a Central_kyc_records.
     * @example
     * // Update or create a Central_kyc_records
     * const central_kyc_records = await prisma.central_kyc_records.upsert({
     *   create: {
     *     // ... data to create a Central_kyc_records
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Central_kyc_records we want to update
     *   }
     * })
     */
    upsert<T extends central_kyc_recordsUpsertArgs>(args: SelectSubset<T, central_kyc_recordsUpsertArgs<ExtArgs>>): Prisma__central_kyc_recordsClient<$Result.GetResult<Prisma.$central_kyc_recordsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Central_kyc_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsCountArgs} args - Arguments to filter Central_kyc_records to count.
     * @example
     * // Count the number of Central_kyc_records
     * const count = await prisma.central_kyc_records.count({
     *   where: {
     *     // ... the filter for the Central_kyc_records we want to count
     *   }
     * })
    **/
    count<T extends central_kyc_recordsCountArgs>(
      args?: Subset<T, central_kyc_recordsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Central_kyc_recordsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Central_kyc_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Central_kyc_recordsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Central_kyc_recordsAggregateArgs>(args: Subset<T, Central_kyc_recordsAggregateArgs>): Prisma.PrismaPromise<GetCentral_kyc_recordsAggregateType<T>>

    /**
     * Group by Central_kyc_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_kyc_recordsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends central_kyc_recordsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: central_kyc_recordsGroupByArgs['orderBy'] }
        : { orderBy?: central_kyc_recordsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, central_kyc_recordsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCentral_kyc_recordsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the central_kyc_records model
   */
  readonly fields: central_kyc_recordsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for central_kyc_records.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__central_kyc_recordsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the central_kyc_records model
   */
  interface central_kyc_recordsFieldRefs {
    readonly id: FieldRef<"central_kyc_records", 'String'>
    readonly aadhaar_hash: FieldRef<"central_kyc_records", 'String'>
    readonly method: FieldRef<"central_kyc_records", 'String'>
    readonly kyc_timestamp: FieldRef<"central_kyc_records", 'DateTime'>
    readonly name: FieldRef<"central_kyc_records", 'String'>
    readonly dob: FieldRef<"central_kyc_records", 'String'>
    readonly gender: FieldRef<"central_kyc_records", 'String'>
    readonly careof: FieldRef<"central_kyc_records", 'String'>
    readonly mobile_encrypted: FieldRef<"central_kyc_records", 'String'>
    readonly email_encrypted: FieldRef<"central_kyc_records", 'String'>
    readonly house: FieldRef<"central_kyc_records", 'String'>
    readonly street: FieldRef<"central_kyc_records", 'String'>
    readonly loc: FieldRef<"central_kyc_records", 'String'>
    readonly vtc: FieldRef<"central_kyc_records", 'String'>
    readonly po: FieldRef<"central_kyc_records", 'String'>
    readonly subdist: FieldRef<"central_kyc_records", 'String'>
    readonly dist: FieldRef<"central_kyc_records", 'String'>
    readonly state: FieldRef<"central_kyc_records", 'String'>
    readonly country: FieldRef<"central_kyc_records", 'String'>
    readonly pc: FieldRef<"central_kyc_records", 'String'>
    readonly pht: FieldRef<"central_kyc_records", 'String'>
    readonly task_id: FieldRef<"central_kyc_records", 'String'>
    readonly created_at: FieldRef<"central_kyc_records", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * central_kyc_records findUnique
   */
  export type central_kyc_recordsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_kyc_records to fetch.
     */
    where: central_kyc_recordsWhereUniqueInput
  }

  /**
   * central_kyc_records findUniqueOrThrow
   */
  export type central_kyc_recordsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_kyc_records to fetch.
     */
    where: central_kyc_recordsWhereUniqueInput
  }

  /**
   * central_kyc_records findFirst
   */
  export type central_kyc_recordsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_kyc_records to fetch.
     */
    where?: central_kyc_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_kyc_records to fetch.
     */
    orderBy?: central_kyc_recordsOrderByWithRelationInput | central_kyc_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_kyc_records.
     */
    cursor?: central_kyc_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_kyc_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_kyc_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_kyc_records.
     */
    distinct?: Central_kyc_recordsScalarFieldEnum | Central_kyc_recordsScalarFieldEnum[]
  }

  /**
   * central_kyc_records findFirstOrThrow
   */
  export type central_kyc_recordsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_kyc_records to fetch.
     */
    where?: central_kyc_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_kyc_records to fetch.
     */
    orderBy?: central_kyc_recordsOrderByWithRelationInput | central_kyc_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_kyc_records.
     */
    cursor?: central_kyc_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_kyc_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_kyc_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_kyc_records.
     */
    distinct?: Central_kyc_recordsScalarFieldEnum | Central_kyc_recordsScalarFieldEnum[]
  }

  /**
   * central_kyc_records findMany
   */
  export type central_kyc_recordsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_kyc_records to fetch.
     */
    where?: central_kyc_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_kyc_records to fetch.
     */
    orderBy?: central_kyc_recordsOrderByWithRelationInput | central_kyc_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing central_kyc_records.
     */
    cursor?: central_kyc_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_kyc_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_kyc_records.
     */
    skip?: number
    distinct?: Central_kyc_recordsScalarFieldEnum | Central_kyc_recordsScalarFieldEnum[]
  }

  /**
   * central_kyc_records create
   */
  export type central_kyc_recordsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * The data needed to create a central_kyc_records.
     */
    data: XOR<central_kyc_recordsCreateInput, central_kyc_recordsUncheckedCreateInput>
  }

  /**
   * central_kyc_records createMany
   */
  export type central_kyc_recordsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many central_kyc_records.
     */
    data: central_kyc_recordsCreateManyInput | central_kyc_recordsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * central_kyc_records createManyAndReturn
   */
  export type central_kyc_recordsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * The data used to create many central_kyc_records.
     */
    data: central_kyc_recordsCreateManyInput | central_kyc_recordsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * central_kyc_records update
   */
  export type central_kyc_recordsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * The data needed to update a central_kyc_records.
     */
    data: XOR<central_kyc_recordsUpdateInput, central_kyc_recordsUncheckedUpdateInput>
    /**
     * Choose, which central_kyc_records to update.
     */
    where: central_kyc_recordsWhereUniqueInput
  }

  /**
   * central_kyc_records updateMany
   */
  export type central_kyc_recordsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update central_kyc_records.
     */
    data: XOR<central_kyc_recordsUpdateManyMutationInput, central_kyc_recordsUncheckedUpdateManyInput>
    /**
     * Filter which central_kyc_records to update
     */
    where?: central_kyc_recordsWhereInput
    /**
     * Limit how many central_kyc_records to update.
     */
    limit?: number
  }

  /**
   * central_kyc_records updateManyAndReturn
   */
  export type central_kyc_recordsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * The data used to update central_kyc_records.
     */
    data: XOR<central_kyc_recordsUpdateManyMutationInput, central_kyc_recordsUncheckedUpdateManyInput>
    /**
     * Filter which central_kyc_records to update
     */
    where?: central_kyc_recordsWhereInput
    /**
     * Limit how many central_kyc_records to update.
     */
    limit?: number
  }

  /**
   * central_kyc_records upsert
   */
  export type central_kyc_recordsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * The filter to search for the central_kyc_records to update in case it exists.
     */
    where: central_kyc_recordsWhereUniqueInput
    /**
     * In case the central_kyc_records found by the `where` argument doesn't exist, create a new central_kyc_records with this data.
     */
    create: XOR<central_kyc_recordsCreateInput, central_kyc_recordsUncheckedCreateInput>
    /**
     * In case the central_kyc_records was found with the provided `where` argument, update it with this data.
     */
    update: XOR<central_kyc_recordsUpdateInput, central_kyc_recordsUncheckedUpdateInput>
  }

  /**
   * central_kyc_records delete
   */
  export type central_kyc_recordsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
    /**
     * Filter which central_kyc_records to delete.
     */
    where: central_kyc_recordsWhereUniqueInput
  }

  /**
   * central_kyc_records deleteMany
   */
  export type central_kyc_recordsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_kyc_records to delete
     */
    where?: central_kyc_recordsWhereInput
    /**
     * Limit how many central_kyc_records to delete.
     */
    limit?: number
  }

  /**
   * central_kyc_records without action
   */
  export type central_kyc_recordsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_kyc_records
     */
    select?: central_kyc_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_kyc_records
     */
    omit?: central_kyc_recordsOmit<ExtArgs> | null
  }


  /**
   * Model central_gst_records
   */

  export type AggregateCentral_gst_records = {
    _count: Central_gst_recordsCountAggregateOutputType | null
    _min: Central_gst_recordsMinAggregateOutputType | null
    _max: Central_gst_recordsMaxAggregateOutputType | null
  }

  export type Central_gst_recordsMinAggregateOutputType = {
    id: string | null
    gstin: string | null
    pan: string | null
    company_name: string | null
    legal_name: string | null
    trade_name: string | null
    state: string | null
    state_code: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    address: string | null
    city: string | null
    pincode: string | null
    location: string | null
    district: string | null
    branch_no: string | null
    branch_name: string | null
    flat_no: string | null
    street: string | null
    centre_jurisdiction: string | null
    centre_code: string | null
    state_jurisdiction: string | null
    cancellation_date: string | null
    data_source: string | null
    created_at: Date | null
  }

  export type Central_gst_recordsMaxAggregateOutputType = {
    id: string | null
    gstin: string | null
    pan: string | null
    company_name: string | null
    legal_name: string | null
    trade_name: string | null
    state: string | null
    state_code: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    address: string | null
    city: string | null
    pincode: string | null
    location: string | null
    district: string | null
    branch_no: string | null
    branch_name: string | null
    flat_no: string | null
    street: string | null
    centre_jurisdiction: string | null
    centre_code: string | null
    state_jurisdiction: string | null
    cancellation_date: string | null
    data_source: string | null
    created_at: Date | null
  }

  export type Central_gst_recordsCountAggregateOutputType = {
    id: number
    gstin: number
    pan: number
    company_name: number
    legal_name: number
    trade_name: number
    state: number
    state_code: number
    gst_status: number
    gst_reg_date: number
    taxpayer_type: number
    constitution: number
    business_nature: number
    dealing_in: number
    address: number
    city: number
    pincode: number
    location: number
    district: number
    branch_no: number
    branch_name: number
    flat_no: number
    street: number
    centre_jurisdiction: number
    centre_code: number
    state_jurisdiction: number
    cancellation_date: number
    data_source: number
    raw: number
    created_at: number
    _all: number
  }


  export type Central_gst_recordsMinAggregateInputType = {
    id?: true
    gstin?: true
    pan?: true
    company_name?: true
    legal_name?: true
    trade_name?: true
    state?: true
    state_code?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    address?: true
    city?: true
    pincode?: true
    location?: true
    district?: true
    branch_no?: true
    branch_name?: true
    flat_no?: true
    street?: true
    centre_jurisdiction?: true
    centre_code?: true
    state_jurisdiction?: true
    cancellation_date?: true
    data_source?: true
    created_at?: true
  }

  export type Central_gst_recordsMaxAggregateInputType = {
    id?: true
    gstin?: true
    pan?: true
    company_name?: true
    legal_name?: true
    trade_name?: true
    state?: true
    state_code?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    address?: true
    city?: true
    pincode?: true
    location?: true
    district?: true
    branch_no?: true
    branch_name?: true
    flat_no?: true
    street?: true
    centre_jurisdiction?: true
    centre_code?: true
    state_jurisdiction?: true
    cancellation_date?: true
    data_source?: true
    created_at?: true
  }

  export type Central_gst_recordsCountAggregateInputType = {
    id?: true
    gstin?: true
    pan?: true
    company_name?: true
    legal_name?: true
    trade_name?: true
    state?: true
    state_code?: true
    gst_status?: true
    gst_reg_date?: true
    taxpayer_type?: true
    constitution?: true
    business_nature?: true
    dealing_in?: true
    address?: true
    city?: true
    pincode?: true
    location?: true
    district?: true
    branch_no?: true
    branch_name?: true
    flat_no?: true
    street?: true
    centre_jurisdiction?: true
    centre_code?: true
    state_jurisdiction?: true
    cancellation_date?: true
    data_source?: true
    raw?: true
    created_at?: true
    _all?: true
  }

  export type Central_gst_recordsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_gst_records to aggregate.
     */
    where?: central_gst_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_gst_records to fetch.
     */
    orderBy?: central_gst_recordsOrderByWithRelationInput | central_gst_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: central_gst_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_gst_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_gst_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned central_gst_records
    **/
    _count?: true | Central_gst_recordsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Central_gst_recordsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Central_gst_recordsMaxAggregateInputType
  }

  export type GetCentral_gst_recordsAggregateType<T extends Central_gst_recordsAggregateArgs> = {
        [P in keyof T & keyof AggregateCentral_gst_records]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCentral_gst_records[P]>
      : GetScalarType<T[P], AggregateCentral_gst_records[P]>
  }



  export type central_gst_recordsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: central_gst_recordsWhereInput
    orderBy?: central_gst_recordsOrderByWithAggregationInput | central_gst_recordsOrderByWithAggregationInput[]
    by: Central_gst_recordsScalarFieldEnum[] | Central_gst_recordsScalarFieldEnum
    having?: central_gst_recordsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Central_gst_recordsCountAggregateInputType | true
    _min?: Central_gst_recordsMinAggregateInputType
    _max?: Central_gst_recordsMaxAggregateInputType
  }

  export type Central_gst_recordsGroupByOutputType = {
    id: string
    gstin: string
    pan: string | null
    company_name: string | null
    legal_name: string | null
    trade_name: string | null
    state: string | null
    state_code: string | null
    gst_status: string | null
    gst_reg_date: string | null
    taxpayer_type: string | null
    constitution: string | null
    business_nature: JsonValue | null
    dealing_in: JsonValue | null
    address: string | null
    city: string | null
    pincode: string | null
    location: string | null
    district: string | null
    branch_no: string | null
    branch_name: string | null
    flat_no: string | null
    street: string | null
    centre_jurisdiction: string | null
    centre_code: string | null
    state_jurisdiction: string | null
    cancellation_date: string | null
    data_source: string | null
    raw: JsonValue | null
    created_at: Date
    _count: Central_gst_recordsCountAggregateOutputType | null
    _min: Central_gst_recordsMinAggregateOutputType | null
    _max: Central_gst_recordsMaxAggregateOutputType | null
  }

  type GetCentral_gst_recordsGroupByPayload<T extends central_gst_recordsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Central_gst_recordsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Central_gst_recordsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Central_gst_recordsGroupByOutputType[P]>
            : GetScalarType<T[P], Central_gst_recordsGroupByOutputType[P]>
        }
      >
    >


  export type central_gst_recordsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gstin?: boolean
    pan?: boolean
    company_name?: boolean
    legal_name?: boolean
    trade_name?: boolean
    state?: boolean
    state_code?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    business_nature?: boolean
    dealing_in?: boolean
    address?: boolean
    city?: boolean
    pincode?: boolean
    location?: boolean
    district?: boolean
    branch_no?: boolean
    branch_name?: boolean
    flat_no?: boolean
    street?: boolean
    centre_jurisdiction?: boolean
    centre_code?: boolean
    state_jurisdiction?: boolean
    cancellation_date?: boolean
    data_source?: boolean
    raw?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_gst_records"]>

  export type central_gst_recordsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gstin?: boolean
    pan?: boolean
    company_name?: boolean
    legal_name?: boolean
    trade_name?: boolean
    state?: boolean
    state_code?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    business_nature?: boolean
    dealing_in?: boolean
    address?: boolean
    city?: boolean
    pincode?: boolean
    location?: boolean
    district?: boolean
    branch_no?: boolean
    branch_name?: boolean
    flat_no?: boolean
    street?: boolean
    centre_jurisdiction?: boolean
    centre_code?: boolean
    state_jurisdiction?: boolean
    cancellation_date?: boolean
    data_source?: boolean
    raw?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_gst_records"]>

  export type central_gst_recordsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    gstin?: boolean
    pan?: boolean
    company_name?: boolean
    legal_name?: boolean
    trade_name?: boolean
    state?: boolean
    state_code?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    business_nature?: boolean
    dealing_in?: boolean
    address?: boolean
    city?: boolean
    pincode?: boolean
    location?: boolean
    district?: boolean
    branch_no?: boolean
    branch_name?: boolean
    flat_no?: boolean
    street?: boolean
    centre_jurisdiction?: boolean
    centre_code?: boolean
    state_jurisdiction?: boolean
    cancellation_date?: boolean
    data_source?: boolean
    raw?: boolean
    created_at?: boolean
  }, ExtArgs["result"]["central_gst_records"]>

  export type central_gst_recordsSelectScalar = {
    id?: boolean
    gstin?: boolean
    pan?: boolean
    company_name?: boolean
    legal_name?: boolean
    trade_name?: boolean
    state?: boolean
    state_code?: boolean
    gst_status?: boolean
    gst_reg_date?: boolean
    taxpayer_type?: boolean
    constitution?: boolean
    business_nature?: boolean
    dealing_in?: boolean
    address?: boolean
    city?: boolean
    pincode?: boolean
    location?: boolean
    district?: boolean
    branch_no?: boolean
    branch_name?: boolean
    flat_no?: boolean
    street?: boolean
    centre_jurisdiction?: boolean
    centre_code?: boolean
    state_jurisdiction?: boolean
    cancellation_date?: boolean
    data_source?: boolean
    raw?: boolean
    created_at?: boolean
  }

  export type central_gst_recordsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "gstin" | "pan" | "company_name" | "legal_name" | "trade_name" | "state" | "state_code" | "gst_status" | "gst_reg_date" | "taxpayer_type" | "constitution" | "business_nature" | "dealing_in" | "address" | "city" | "pincode" | "location" | "district" | "branch_no" | "branch_name" | "flat_no" | "street" | "centre_jurisdiction" | "centre_code" | "state_jurisdiction" | "cancellation_date" | "data_source" | "raw" | "created_at", ExtArgs["result"]["central_gst_records"]>

  export type $central_gst_recordsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "central_gst_records"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      gstin: string
      pan: string | null
      company_name: string | null
      legal_name: string | null
      trade_name: string | null
      state: string | null
      state_code: string | null
      gst_status: string | null
      gst_reg_date: string | null
      taxpayer_type: string | null
      constitution: string | null
      business_nature: Prisma.JsonValue | null
      dealing_in: Prisma.JsonValue | null
      address: string | null
      city: string | null
      pincode: string | null
      location: string | null
      district: string | null
      branch_no: string | null
      branch_name: string | null
      flat_no: string | null
      street: string | null
      centre_jurisdiction: string | null
      centre_code: string | null
      state_jurisdiction: string | null
      cancellation_date: string | null
      data_source: string | null
      raw: Prisma.JsonValue | null
      created_at: Date
    }, ExtArgs["result"]["central_gst_records"]>
    composites: {}
  }

  type central_gst_recordsGetPayload<S extends boolean | null | undefined | central_gst_recordsDefaultArgs> = $Result.GetResult<Prisma.$central_gst_recordsPayload, S>

  type central_gst_recordsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<central_gst_recordsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Central_gst_recordsCountAggregateInputType | true
    }

  export interface central_gst_recordsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['central_gst_records'], meta: { name: 'central_gst_records' } }
    /**
     * Find zero or one Central_gst_records that matches the filter.
     * @param {central_gst_recordsFindUniqueArgs} args - Arguments to find a Central_gst_records
     * @example
     * // Get one Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends central_gst_recordsFindUniqueArgs>(args: SelectSubset<T, central_gst_recordsFindUniqueArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Central_gst_records that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {central_gst_recordsFindUniqueOrThrowArgs} args - Arguments to find a Central_gst_records
     * @example
     * // Get one Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends central_gst_recordsFindUniqueOrThrowArgs>(args: SelectSubset<T, central_gst_recordsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_gst_records that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsFindFirstArgs} args - Arguments to find a Central_gst_records
     * @example
     * // Get one Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends central_gst_recordsFindFirstArgs>(args?: SelectSubset<T, central_gst_recordsFindFirstArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Central_gst_records that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsFindFirstOrThrowArgs} args - Arguments to find a Central_gst_records
     * @example
     * // Get one Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends central_gst_recordsFindFirstOrThrowArgs>(args?: SelectSubset<T, central_gst_recordsFindFirstOrThrowArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Central_gst_records that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findMany()
     * 
     * // Get first 10 Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const central_gst_recordsWithIdOnly = await prisma.central_gst_records.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends central_gst_recordsFindManyArgs>(args?: SelectSubset<T, central_gst_recordsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Central_gst_records.
     * @param {central_gst_recordsCreateArgs} args - Arguments to create a Central_gst_records.
     * @example
     * // Create one Central_gst_records
     * const Central_gst_records = await prisma.central_gst_records.create({
     *   data: {
     *     // ... data to create a Central_gst_records
     *   }
     * })
     * 
     */
    create<T extends central_gst_recordsCreateArgs>(args: SelectSubset<T, central_gst_recordsCreateArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Central_gst_records.
     * @param {central_gst_recordsCreateManyArgs} args - Arguments to create many Central_gst_records.
     * @example
     * // Create many Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends central_gst_recordsCreateManyArgs>(args?: SelectSubset<T, central_gst_recordsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Central_gst_records and returns the data saved in the database.
     * @param {central_gst_recordsCreateManyAndReturnArgs} args - Arguments to create many Central_gst_records.
     * @example
     * // Create many Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Central_gst_records and only return the `id`
     * const central_gst_recordsWithIdOnly = await prisma.central_gst_records.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends central_gst_recordsCreateManyAndReturnArgs>(args?: SelectSubset<T, central_gst_recordsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Central_gst_records.
     * @param {central_gst_recordsDeleteArgs} args - Arguments to delete one Central_gst_records.
     * @example
     * // Delete one Central_gst_records
     * const Central_gst_records = await prisma.central_gst_records.delete({
     *   where: {
     *     // ... filter to delete one Central_gst_records
     *   }
     * })
     * 
     */
    delete<T extends central_gst_recordsDeleteArgs>(args: SelectSubset<T, central_gst_recordsDeleteArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Central_gst_records.
     * @param {central_gst_recordsUpdateArgs} args - Arguments to update one Central_gst_records.
     * @example
     * // Update one Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends central_gst_recordsUpdateArgs>(args: SelectSubset<T, central_gst_recordsUpdateArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Central_gst_records.
     * @param {central_gst_recordsDeleteManyArgs} args - Arguments to filter Central_gst_records to delete.
     * @example
     * // Delete a few Central_gst_records
     * const { count } = await prisma.central_gst_records.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends central_gst_recordsDeleteManyArgs>(args?: SelectSubset<T, central_gst_recordsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_gst_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends central_gst_recordsUpdateManyArgs>(args: SelectSubset<T, central_gst_recordsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Central_gst_records and returns the data updated in the database.
     * @param {central_gst_recordsUpdateManyAndReturnArgs} args - Arguments to update many Central_gst_records.
     * @example
     * // Update many Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Central_gst_records and only return the `id`
     * const central_gst_recordsWithIdOnly = await prisma.central_gst_records.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends central_gst_recordsUpdateManyAndReturnArgs>(args: SelectSubset<T, central_gst_recordsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Central_gst_records.
     * @param {central_gst_recordsUpsertArgs} args - Arguments to update or create a Central_gst_records.
     * @example
     * // Update or create a Central_gst_records
     * const central_gst_records = await prisma.central_gst_records.upsert({
     *   create: {
     *     // ... data to create a Central_gst_records
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Central_gst_records we want to update
     *   }
     * })
     */
    upsert<T extends central_gst_recordsUpsertArgs>(args: SelectSubset<T, central_gst_recordsUpsertArgs<ExtArgs>>): Prisma__central_gst_recordsClient<$Result.GetResult<Prisma.$central_gst_recordsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Central_gst_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsCountArgs} args - Arguments to filter Central_gst_records to count.
     * @example
     * // Count the number of Central_gst_records
     * const count = await prisma.central_gst_records.count({
     *   where: {
     *     // ... the filter for the Central_gst_records we want to count
     *   }
     * })
    **/
    count<T extends central_gst_recordsCountArgs>(
      args?: Subset<T, central_gst_recordsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Central_gst_recordsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Central_gst_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Central_gst_recordsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Central_gst_recordsAggregateArgs>(args: Subset<T, Central_gst_recordsAggregateArgs>): Prisma.PrismaPromise<GetCentral_gst_recordsAggregateType<T>>

    /**
     * Group by Central_gst_records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {central_gst_recordsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends central_gst_recordsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: central_gst_recordsGroupByArgs['orderBy'] }
        : { orderBy?: central_gst_recordsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, central_gst_recordsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCentral_gst_recordsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the central_gst_records model
   */
  readonly fields: central_gst_recordsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for central_gst_records.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__central_gst_recordsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the central_gst_records model
   */
  interface central_gst_recordsFieldRefs {
    readonly id: FieldRef<"central_gst_records", 'String'>
    readonly gstin: FieldRef<"central_gst_records", 'String'>
    readonly pan: FieldRef<"central_gst_records", 'String'>
    readonly company_name: FieldRef<"central_gst_records", 'String'>
    readonly legal_name: FieldRef<"central_gst_records", 'String'>
    readonly trade_name: FieldRef<"central_gst_records", 'String'>
    readonly state: FieldRef<"central_gst_records", 'String'>
    readonly state_code: FieldRef<"central_gst_records", 'String'>
    readonly gst_status: FieldRef<"central_gst_records", 'String'>
    readonly gst_reg_date: FieldRef<"central_gst_records", 'String'>
    readonly taxpayer_type: FieldRef<"central_gst_records", 'String'>
    readonly constitution: FieldRef<"central_gst_records", 'String'>
    readonly business_nature: FieldRef<"central_gst_records", 'Json'>
    readonly dealing_in: FieldRef<"central_gst_records", 'Json'>
    readonly address: FieldRef<"central_gst_records", 'String'>
    readonly city: FieldRef<"central_gst_records", 'String'>
    readonly pincode: FieldRef<"central_gst_records", 'String'>
    readonly location: FieldRef<"central_gst_records", 'String'>
    readonly district: FieldRef<"central_gst_records", 'String'>
    readonly branch_no: FieldRef<"central_gst_records", 'String'>
    readonly branch_name: FieldRef<"central_gst_records", 'String'>
    readonly flat_no: FieldRef<"central_gst_records", 'String'>
    readonly street: FieldRef<"central_gst_records", 'String'>
    readonly centre_jurisdiction: FieldRef<"central_gst_records", 'String'>
    readonly centre_code: FieldRef<"central_gst_records", 'String'>
    readonly state_jurisdiction: FieldRef<"central_gst_records", 'String'>
    readonly cancellation_date: FieldRef<"central_gst_records", 'String'>
    readonly data_source: FieldRef<"central_gst_records", 'String'>
    readonly raw: FieldRef<"central_gst_records", 'Json'>
    readonly created_at: FieldRef<"central_gst_records", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * central_gst_records findUnique
   */
  export type central_gst_recordsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_gst_records to fetch.
     */
    where: central_gst_recordsWhereUniqueInput
  }

  /**
   * central_gst_records findUniqueOrThrow
   */
  export type central_gst_recordsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_gst_records to fetch.
     */
    where: central_gst_recordsWhereUniqueInput
  }

  /**
   * central_gst_records findFirst
   */
  export type central_gst_recordsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_gst_records to fetch.
     */
    where?: central_gst_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_gst_records to fetch.
     */
    orderBy?: central_gst_recordsOrderByWithRelationInput | central_gst_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_gst_records.
     */
    cursor?: central_gst_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_gst_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_gst_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_gst_records.
     */
    distinct?: Central_gst_recordsScalarFieldEnum | Central_gst_recordsScalarFieldEnum[]
  }

  /**
   * central_gst_records findFirstOrThrow
   */
  export type central_gst_recordsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_gst_records to fetch.
     */
    where?: central_gst_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_gst_records to fetch.
     */
    orderBy?: central_gst_recordsOrderByWithRelationInput | central_gst_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for central_gst_records.
     */
    cursor?: central_gst_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_gst_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_gst_records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of central_gst_records.
     */
    distinct?: Central_gst_recordsScalarFieldEnum | Central_gst_recordsScalarFieldEnum[]
  }

  /**
   * central_gst_records findMany
   */
  export type central_gst_recordsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter, which central_gst_records to fetch.
     */
    where?: central_gst_recordsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of central_gst_records to fetch.
     */
    orderBy?: central_gst_recordsOrderByWithRelationInput | central_gst_recordsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing central_gst_records.
     */
    cursor?: central_gst_recordsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` central_gst_records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` central_gst_records.
     */
    skip?: number
    distinct?: Central_gst_recordsScalarFieldEnum | Central_gst_recordsScalarFieldEnum[]
  }

  /**
   * central_gst_records create
   */
  export type central_gst_recordsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * The data needed to create a central_gst_records.
     */
    data: XOR<central_gst_recordsCreateInput, central_gst_recordsUncheckedCreateInput>
  }

  /**
   * central_gst_records createMany
   */
  export type central_gst_recordsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many central_gst_records.
     */
    data: central_gst_recordsCreateManyInput | central_gst_recordsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * central_gst_records createManyAndReturn
   */
  export type central_gst_recordsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * The data used to create many central_gst_records.
     */
    data: central_gst_recordsCreateManyInput | central_gst_recordsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * central_gst_records update
   */
  export type central_gst_recordsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * The data needed to update a central_gst_records.
     */
    data: XOR<central_gst_recordsUpdateInput, central_gst_recordsUncheckedUpdateInput>
    /**
     * Choose, which central_gst_records to update.
     */
    where: central_gst_recordsWhereUniqueInput
  }

  /**
   * central_gst_records updateMany
   */
  export type central_gst_recordsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update central_gst_records.
     */
    data: XOR<central_gst_recordsUpdateManyMutationInput, central_gst_recordsUncheckedUpdateManyInput>
    /**
     * Filter which central_gst_records to update
     */
    where?: central_gst_recordsWhereInput
    /**
     * Limit how many central_gst_records to update.
     */
    limit?: number
  }

  /**
   * central_gst_records updateManyAndReturn
   */
  export type central_gst_recordsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * The data used to update central_gst_records.
     */
    data: XOR<central_gst_recordsUpdateManyMutationInput, central_gst_recordsUncheckedUpdateManyInput>
    /**
     * Filter which central_gst_records to update
     */
    where?: central_gst_recordsWhereInput
    /**
     * Limit how many central_gst_records to update.
     */
    limit?: number
  }

  /**
   * central_gst_records upsert
   */
  export type central_gst_recordsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * The filter to search for the central_gst_records to update in case it exists.
     */
    where: central_gst_recordsWhereUniqueInput
    /**
     * In case the central_gst_records found by the `where` argument doesn't exist, create a new central_gst_records with this data.
     */
    create: XOR<central_gst_recordsCreateInput, central_gst_recordsUncheckedCreateInput>
    /**
     * In case the central_gst_records was found with the provided `where` argument, update it with this data.
     */
    update: XOR<central_gst_recordsUpdateInput, central_gst_recordsUncheckedUpdateInput>
  }

  /**
   * central_gst_records delete
   */
  export type central_gst_recordsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
    /**
     * Filter which central_gst_records to delete.
     */
    where: central_gst_recordsWhereUniqueInput
  }

  /**
   * central_gst_records deleteMany
   */
  export type central_gst_recordsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which central_gst_records to delete
     */
    where?: central_gst_recordsWhereInput
    /**
     * Limit how many central_gst_records to delete.
     */
    limit?: number
  }

  /**
   * central_gst_records without action
   */
  export type central_gst_recordsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the central_gst_records
     */
    select?: central_gst_recordsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the central_gst_records
     */
    omit?: central_gst_recordsOmit<ExtArgs> | null
  }


  /**
   * Model platform_settings
   */

  export type AggregatePlatform_settings = {
    _count: Platform_settingsCountAggregateOutputType | null
    _min: Platform_settingsMinAggregateOutputType | null
    _max: Platform_settingsMaxAggregateOutputType | null
  }

  export type Platform_settingsMinAggregateOutputType = {
    id: string | null
    updated_at: Date | null
  }

  export type Platform_settingsMaxAggregateOutputType = {
    id: string | null
    updated_at: Date | null
  }

  export type Platform_settingsCountAggregateOutputType = {
    id: number
    values: number
    updated_at: number
    _all: number
  }


  export type Platform_settingsMinAggregateInputType = {
    id?: true
    updated_at?: true
  }

  export type Platform_settingsMaxAggregateInputType = {
    id?: true
    updated_at?: true
  }

  export type Platform_settingsCountAggregateInputType = {
    id?: true
    values?: true
    updated_at?: true
    _all?: true
  }

  export type Platform_settingsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which platform_settings to aggregate.
     */
    where?: platform_settingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of platform_settings to fetch.
     */
    orderBy?: platform_settingsOrderByWithRelationInput | platform_settingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: platform_settingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` platform_settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` platform_settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned platform_settings
    **/
    _count?: true | Platform_settingsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Platform_settingsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Platform_settingsMaxAggregateInputType
  }

  export type GetPlatform_settingsAggregateType<T extends Platform_settingsAggregateArgs> = {
        [P in keyof T & keyof AggregatePlatform_settings]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlatform_settings[P]>
      : GetScalarType<T[P], AggregatePlatform_settings[P]>
  }



  export type platform_settingsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: platform_settingsWhereInput
    orderBy?: platform_settingsOrderByWithAggregationInput | platform_settingsOrderByWithAggregationInput[]
    by: Platform_settingsScalarFieldEnum[] | Platform_settingsScalarFieldEnum
    having?: platform_settingsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Platform_settingsCountAggregateInputType | true
    _min?: Platform_settingsMinAggregateInputType
    _max?: Platform_settingsMaxAggregateInputType
  }

  export type Platform_settingsGroupByOutputType = {
    id: string
    values: JsonValue
    updated_at: Date
    _count: Platform_settingsCountAggregateOutputType | null
    _min: Platform_settingsMinAggregateOutputType | null
    _max: Platform_settingsMaxAggregateOutputType | null
  }

  type GetPlatform_settingsGroupByPayload<T extends platform_settingsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Platform_settingsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Platform_settingsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Platform_settingsGroupByOutputType[P]>
            : GetScalarType<T[P], Platform_settingsGroupByOutputType[P]>
        }
      >
    >


  export type platform_settingsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    values?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["platform_settings"]>

  export type platform_settingsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    values?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["platform_settings"]>

  export type platform_settingsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    values?: boolean
    updated_at?: boolean
  }, ExtArgs["result"]["platform_settings"]>

  export type platform_settingsSelectScalar = {
    id?: boolean
    values?: boolean
    updated_at?: boolean
  }

  export type platform_settingsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "values" | "updated_at", ExtArgs["result"]["platform_settings"]>

  export type $platform_settingsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "platform_settings"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      values: Prisma.JsonValue
      updated_at: Date
    }, ExtArgs["result"]["platform_settings"]>
    composites: {}
  }

  type platform_settingsGetPayload<S extends boolean | null | undefined | platform_settingsDefaultArgs> = $Result.GetResult<Prisma.$platform_settingsPayload, S>

  type platform_settingsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<platform_settingsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Platform_settingsCountAggregateInputType | true
    }

  export interface platform_settingsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['platform_settings'], meta: { name: 'platform_settings' } }
    /**
     * Find zero or one Platform_settings that matches the filter.
     * @param {platform_settingsFindUniqueArgs} args - Arguments to find a Platform_settings
     * @example
     * // Get one Platform_settings
     * const platform_settings = await prisma.platform_settings.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends platform_settingsFindUniqueArgs>(args: SelectSubset<T, platform_settingsFindUniqueArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Platform_settings that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {platform_settingsFindUniqueOrThrowArgs} args - Arguments to find a Platform_settings
     * @example
     * // Get one Platform_settings
     * const platform_settings = await prisma.platform_settings.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends platform_settingsFindUniqueOrThrowArgs>(args: SelectSubset<T, platform_settingsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Platform_settings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsFindFirstArgs} args - Arguments to find a Platform_settings
     * @example
     * // Get one Platform_settings
     * const platform_settings = await prisma.platform_settings.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends platform_settingsFindFirstArgs>(args?: SelectSubset<T, platform_settingsFindFirstArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Platform_settings that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsFindFirstOrThrowArgs} args - Arguments to find a Platform_settings
     * @example
     * // Get one Platform_settings
     * const platform_settings = await prisma.platform_settings.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends platform_settingsFindFirstOrThrowArgs>(args?: SelectSubset<T, platform_settingsFindFirstOrThrowArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Platform_settings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Platform_settings
     * const platform_settings = await prisma.platform_settings.findMany()
     * 
     * // Get first 10 Platform_settings
     * const platform_settings = await prisma.platform_settings.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const platform_settingsWithIdOnly = await prisma.platform_settings.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends platform_settingsFindManyArgs>(args?: SelectSubset<T, platform_settingsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Platform_settings.
     * @param {platform_settingsCreateArgs} args - Arguments to create a Platform_settings.
     * @example
     * // Create one Platform_settings
     * const Platform_settings = await prisma.platform_settings.create({
     *   data: {
     *     // ... data to create a Platform_settings
     *   }
     * })
     * 
     */
    create<T extends platform_settingsCreateArgs>(args: SelectSubset<T, platform_settingsCreateArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Platform_settings.
     * @param {platform_settingsCreateManyArgs} args - Arguments to create many Platform_settings.
     * @example
     * // Create many Platform_settings
     * const platform_settings = await prisma.platform_settings.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends platform_settingsCreateManyArgs>(args?: SelectSubset<T, platform_settingsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Platform_settings and returns the data saved in the database.
     * @param {platform_settingsCreateManyAndReturnArgs} args - Arguments to create many Platform_settings.
     * @example
     * // Create many Platform_settings
     * const platform_settings = await prisma.platform_settings.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Platform_settings and only return the `id`
     * const platform_settingsWithIdOnly = await prisma.platform_settings.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends platform_settingsCreateManyAndReturnArgs>(args?: SelectSubset<T, platform_settingsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Platform_settings.
     * @param {platform_settingsDeleteArgs} args - Arguments to delete one Platform_settings.
     * @example
     * // Delete one Platform_settings
     * const Platform_settings = await prisma.platform_settings.delete({
     *   where: {
     *     // ... filter to delete one Platform_settings
     *   }
     * })
     * 
     */
    delete<T extends platform_settingsDeleteArgs>(args: SelectSubset<T, platform_settingsDeleteArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Platform_settings.
     * @param {platform_settingsUpdateArgs} args - Arguments to update one Platform_settings.
     * @example
     * // Update one Platform_settings
     * const platform_settings = await prisma.platform_settings.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends platform_settingsUpdateArgs>(args: SelectSubset<T, platform_settingsUpdateArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Platform_settings.
     * @param {platform_settingsDeleteManyArgs} args - Arguments to filter Platform_settings to delete.
     * @example
     * // Delete a few Platform_settings
     * const { count } = await prisma.platform_settings.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends platform_settingsDeleteManyArgs>(args?: SelectSubset<T, platform_settingsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Platform_settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Platform_settings
     * const platform_settings = await prisma.platform_settings.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends platform_settingsUpdateManyArgs>(args: SelectSubset<T, platform_settingsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Platform_settings and returns the data updated in the database.
     * @param {platform_settingsUpdateManyAndReturnArgs} args - Arguments to update many Platform_settings.
     * @example
     * // Update many Platform_settings
     * const platform_settings = await prisma.platform_settings.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Platform_settings and only return the `id`
     * const platform_settingsWithIdOnly = await prisma.platform_settings.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends platform_settingsUpdateManyAndReturnArgs>(args: SelectSubset<T, platform_settingsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Platform_settings.
     * @param {platform_settingsUpsertArgs} args - Arguments to update or create a Platform_settings.
     * @example
     * // Update or create a Platform_settings
     * const platform_settings = await prisma.platform_settings.upsert({
     *   create: {
     *     // ... data to create a Platform_settings
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Platform_settings we want to update
     *   }
     * })
     */
    upsert<T extends platform_settingsUpsertArgs>(args: SelectSubset<T, platform_settingsUpsertArgs<ExtArgs>>): Prisma__platform_settingsClient<$Result.GetResult<Prisma.$platform_settingsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Platform_settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsCountArgs} args - Arguments to filter Platform_settings to count.
     * @example
     * // Count the number of Platform_settings
     * const count = await prisma.platform_settings.count({
     *   where: {
     *     // ... the filter for the Platform_settings we want to count
     *   }
     * })
    **/
    count<T extends platform_settingsCountArgs>(
      args?: Subset<T, platform_settingsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Platform_settingsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Platform_settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Platform_settingsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Platform_settingsAggregateArgs>(args: Subset<T, Platform_settingsAggregateArgs>): Prisma.PrismaPromise<GetPlatform_settingsAggregateType<T>>

    /**
     * Group by Platform_settings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {platform_settingsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends platform_settingsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: platform_settingsGroupByArgs['orderBy'] }
        : { orderBy?: platform_settingsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, platform_settingsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPlatform_settingsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the platform_settings model
   */
  readonly fields: platform_settingsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for platform_settings.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__platform_settingsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the platform_settings model
   */
  interface platform_settingsFieldRefs {
    readonly id: FieldRef<"platform_settings", 'String'>
    readonly values: FieldRef<"platform_settings", 'Json'>
    readonly updated_at: FieldRef<"platform_settings", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * platform_settings findUnique
   */
  export type platform_settingsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter, which platform_settings to fetch.
     */
    where: platform_settingsWhereUniqueInput
  }

  /**
   * platform_settings findUniqueOrThrow
   */
  export type platform_settingsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter, which platform_settings to fetch.
     */
    where: platform_settingsWhereUniqueInput
  }

  /**
   * platform_settings findFirst
   */
  export type platform_settingsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter, which platform_settings to fetch.
     */
    where?: platform_settingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of platform_settings to fetch.
     */
    orderBy?: platform_settingsOrderByWithRelationInput | platform_settingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for platform_settings.
     */
    cursor?: platform_settingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` platform_settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` platform_settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of platform_settings.
     */
    distinct?: Platform_settingsScalarFieldEnum | Platform_settingsScalarFieldEnum[]
  }

  /**
   * platform_settings findFirstOrThrow
   */
  export type platform_settingsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter, which platform_settings to fetch.
     */
    where?: platform_settingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of platform_settings to fetch.
     */
    orderBy?: platform_settingsOrderByWithRelationInput | platform_settingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for platform_settings.
     */
    cursor?: platform_settingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` platform_settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` platform_settings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of platform_settings.
     */
    distinct?: Platform_settingsScalarFieldEnum | Platform_settingsScalarFieldEnum[]
  }

  /**
   * platform_settings findMany
   */
  export type platform_settingsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter, which platform_settings to fetch.
     */
    where?: platform_settingsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of platform_settings to fetch.
     */
    orderBy?: platform_settingsOrderByWithRelationInput | platform_settingsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing platform_settings.
     */
    cursor?: platform_settingsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` platform_settings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` platform_settings.
     */
    skip?: number
    distinct?: Platform_settingsScalarFieldEnum | Platform_settingsScalarFieldEnum[]
  }

  /**
   * platform_settings create
   */
  export type platform_settingsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * The data needed to create a platform_settings.
     */
    data: XOR<platform_settingsCreateInput, platform_settingsUncheckedCreateInput>
  }

  /**
   * platform_settings createMany
   */
  export type platform_settingsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many platform_settings.
     */
    data: platform_settingsCreateManyInput | platform_settingsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * platform_settings createManyAndReturn
   */
  export type platform_settingsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * The data used to create many platform_settings.
     */
    data: platform_settingsCreateManyInput | platform_settingsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * platform_settings update
   */
  export type platform_settingsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * The data needed to update a platform_settings.
     */
    data: XOR<platform_settingsUpdateInput, platform_settingsUncheckedUpdateInput>
    /**
     * Choose, which platform_settings to update.
     */
    where: platform_settingsWhereUniqueInput
  }

  /**
   * platform_settings updateMany
   */
  export type platform_settingsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update platform_settings.
     */
    data: XOR<platform_settingsUpdateManyMutationInput, platform_settingsUncheckedUpdateManyInput>
    /**
     * Filter which platform_settings to update
     */
    where?: platform_settingsWhereInput
    /**
     * Limit how many platform_settings to update.
     */
    limit?: number
  }

  /**
   * platform_settings updateManyAndReturn
   */
  export type platform_settingsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * The data used to update platform_settings.
     */
    data: XOR<platform_settingsUpdateManyMutationInput, platform_settingsUncheckedUpdateManyInput>
    /**
     * Filter which platform_settings to update
     */
    where?: platform_settingsWhereInput
    /**
     * Limit how many platform_settings to update.
     */
    limit?: number
  }

  /**
   * platform_settings upsert
   */
  export type platform_settingsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * The filter to search for the platform_settings to update in case it exists.
     */
    where: platform_settingsWhereUniqueInput
    /**
     * In case the platform_settings found by the `where` argument doesn't exist, create a new platform_settings with this data.
     */
    create: XOR<platform_settingsCreateInput, platform_settingsUncheckedCreateInput>
    /**
     * In case the platform_settings was found with the provided `where` argument, update it with this data.
     */
    update: XOR<platform_settingsUpdateInput, platform_settingsUncheckedUpdateInput>
  }

  /**
   * platform_settings delete
   */
  export type platform_settingsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
    /**
     * Filter which platform_settings to delete.
     */
    where: platform_settingsWhereUniqueInput
  }

  /**
   * platform_settings deleteMany
   */
  export type platform_settingsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which platform_settings to delete
     */
    where?: platform_settingsWhereInput
    /**
     * Limit how many platform_settings to delete.
     */
    limit?: number
  }

  /**
   * platform_settings without action
   */
  export type platform_settingsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the platform_settings
     */
    select?: platform_settingsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the platform_settings
     */
    omit?: platform_settingsOmit<ExtArgs> | null
  }


  /**
   * Model tenant_pricing_configs
   */

  export type AggregateTenant_pricing_configs = {
    _count: Tenant_pricing_configsCountAggregateOutputType | null
    _avg: Tenant_pricing_configsAvgAggregateOutputType | null
    _sum: Tenant_pricing_configsSumAggregateOutputType | null
    _min: Tenant_pricing_configsMinAggregateOutputType | null
    _max: Tenant_pricing_configsMaxAggregateOutputType | null
  }

  export type Tenant_pricing_configsAvgAggregateOutputType = {
    base_price_paise: number | null
    employee_cap: number | null
    per_employee_excess_paise: number | null
    discount_base_pct: Decimal | null
    discount_bundle_pct: Decimal | null
    bundle_trigger_count: number | null
    discount_tenure_pct: Decimal | null
    tenure_months: number | null
    offer_flat_paise: number | null
    final_override_paise: number | null
  }

  export type Tenant_pricing_configsSumAggregateOutputType = {
    base_price_paise: number | null
    employee_cap: number | null
    per_employee_excess_paise: number | null
    discount_base_pct: Decimal | null
    discount_bundle_pct: Decimal | null
    bundle_trigger_count: number | null
    discount_tenure_pct: Decimal | null
    tenure_months: number | null
    offer_flat_paise: number | null
    final_override_paise: number | null
  }

  export type Tenant_pricing_configsMinAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    base_price_paise: number | null
    employee_cap: number | null
    per_employee_excess_paise: number | null
    discount_base_pct: Decimal | null
    discount_bundle_pct: Decimal | null
    bundle_trigger_count: number | null
    discount_tenure_pct: Decimal | null
    tenure_months: number | null
    offer_flat_paise: number | null
    offer_expiry_date: Date | null
    is_stackable: boolean | null
    final_override_paise: number | null
    billing_cycle: string | null
    updated_at: Date | null
  }

  export type Tenant_pricing_configsMaxAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    base_price_paise: number | null
    employee_cap: number | null
    per_employee_excess_paise: number | null
    discount_base_pct: Decimal | null
    discount_bundle_pct: Decimal | null
    bundle_trigger_count: number | null
    discount_tenure_pct: Decimal | null
    tenure_months: number | null
    offer_flat_paise: number | null
    offer_expiry_date: Date | null
    is_stackable: boolean | null
    final_override_paise: number | null
    billing_cycle: string | null
    updated_at: Date | null
  }

  export type Tenant_pricing_configsCountAggregateOutputType = {
    id: number
    tenant_id: number
    base_price_paise: number
    employee_cap: number
    per_employee_excess_paise: number
    discount_base_pct: number
    discount_module_pct: number
    discount_bundle_pct: number
    bundle_trigger_count: number
    discount_tenure_pct: number
    tenure_months: number
    offer_flat_paise: number
    offer_expiry_date: number
    is_stackable: number
    final_override_paise: number
    billing_cycle: number
    updated_at: number
    _all: number
  }


  export type Tenant_pricing_configsAvgAggregateInputType = {
    base_price_paise?: true
    employee_cap?: true
    per_employee_excess_paise?: true
    discount_base_pct?: true
    discount_bundle_pct?: true
    bundle_trigger_count?: true
    discount_tenure_pct?: true
    tenure_months?: true
    offer_flat_paise?: true
    final_override_paise?: true
  }

  export type Tenant_pricing_configsSumAggregateInputType = {
    base_price_paise?: true
    employee_cap?: true
    per_employee_excess_paise?: true
    discount_base_pct?: true
    discount_bundle_pct?: true
    bundle_trigger_count?: true
    discount_tenure_pct?: true
    tenure_months?: true
    offer_flat_paise?: true
    final_override_paise?: true
  }

  export type Tenant_pricing_configsMinAggregateInputType = {
    id?: true
    tenant_id?: true
    base_price_paise?: true
    employee_cap?: true
    per_employee_excess_paise?: true
    discount_base_pct?: true
    discount_bundle_pct?: true
    bundle_trigger_count?: true
    discount_tenure_pct?: true
    tenure_months?: true
    offer_flat_paise?: true
    offer_expiry_date?: true
    is_stackable?: true
    final_override_paise?: true
    billing_cycle?: true
    updated_at?: true
  }

  export type Tenant_pricing_configsMaxAggregateInputType = {
    id?: true
    tenant_id?: true
    base_price_paise?: true
    employee_cap?: true
    per_employee_excess_paise?: true
    discount_base_pct?: true
    discount_bundle_pct?: true
    bundle_trigger_count?: true
    discount_tenure_pct?: true
    tenure_months?: true
    offer_flat_paise?: true
    offer_expiry_date?: true
    is_stackable?: true
    final_override_paise?: true
    billing_cycle?: true
    updated_at?: true
  }

  export type Tenant_pricing_configsCountAggregateInputType = {
    id?: true
    tenant_id?: true
    base_price_paise?: true
    employee_cap?: true
    per_employee_excess_paise?: true
    discount_base_pct?: true
    discount_module_pct?: true
    discount_bundle_pct?: true
    bundle_trigger_count?: true
    discount_tenure_pct?: true
    tenure_months?: true
    offer_flat_paise?: true
    offer_expiry_date?: true
    is_stackable?: true
    final_override_paise?: true
    billing_cycle?: true
    updated_at?: true
    _all?: true
  }

  export type Tenant_pricing_configsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_pricing_configs to aggregate.
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_pricing_configs to fetch.
     */
    orderBy?: tenant_pricing_configsOrderByWithRelationInput | tenant_pricing_configsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: tenant_pricing_configsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_pricing_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_pricing_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned tenant_pricing_configs
    **/
    _count?: true | Tenant_pricing_configsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Tenant_pricing_configsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Tenant_pricing_configsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Tenant_pricing_configsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Tenant_pricing_configsMaxAggregateInputType
  }

  export type GetTenant_pricing_configsAggregateType<T extends Tenant_pricing_configsAggregateArgs> = {
        [P in keyof T & keyof AggregateTenant_pricing_configs]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTenant_pricing_configs[P]>
      : GetScalarType<T[P], AggregateTenant_pricing_configs[P]>
  }



  export type tenant_pricing_configsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: tenant_pricing_configsWhereInput
    orderBy?: tenant_pricing_configsOrderByWithAggregationInput | tenant_pricing_configsOrderByWithAggregationInput[]
    by: Tenant_pricing_configsScalarFieldEnum[] | Tenant_pricing_configsScalarFieldEnum
    having?: tenant_pricing_configsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Tenant_pricing_configsCountAggregateInputType | true
    _avg?: Tenant_pricing_configsAvgAggregateInputType
    _sum?: Tenant_pricing_configsSumAggregateInputType
    _min?: Tenant_pricing_configsMinAggregateInputType
    _max?: Tenant_pricing_configsMaxAggregateInputType
  }

  export type Tenant_pricing_configsGroupByOutputType = {
    id: string
    tenant_id: string
    base_price_paise: number
    employee_cap: number | null
    per_employee_excess_paise: number | null
    discount_base_pct: Decimal | null
    discount_module_pct: JsonValue | null
    discount_bundle_pct: Decimal | null
    bundle_trigger_count: number | null
    discount_tenure_pct: Decimal | null
    tenure_months: number | null
    offer_flat_paise: number | null
    offer_expiry_date: Date | null
    is_stackable: boolean | null
    final_override_paise: number | null
    billing_cycle: string | null
    updated_at: Date | null
    _count: Tenant_pricing_configsCountAggregateOutputType | null
    _avg: Tenant_pricing_configsAvgAggregateOutputType | null
    _sum: Tenant_pricing_configsSumAggregateOutputType | null
    _min: Tenant_pricing_configsMinAggregateOutputType | null
    _max: Tenant_pricing_configsMaxAggregateOutputType | null
  }

  type GetTenant_pricing_configsGroupByPayload<T extends tenant_pricing_configsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Tenant_pricing_configsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Tenant_pricing_configsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Tenant_pricing_configsGroupByOutputType[P]>
            : GetScalarType<T[P], Tenant_pricing_configsGroupByOutputType[P]>
        }
      >
    >


  export type tenant_pricing_configsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    base_price_paise?: boolean
    employee_cap?: boolean
    per_employee_excess_paise?: boolean
    discount_base_pct?: boolean
    discount_module_pct?: boolean
    discount_bundle_pct?: boolean
    bundle_trigger_count?: boolean
    discount_tenure_pct?: boolean
    tenure_months?: boolean
    offer_flat_paise?: boolean
    offer_expiry_date?: boolean
    is_stackable?: boolean
    final_override_paise?: boolean
    billing_cycle?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_pricing_configs"]>

  export type tenant_pricing_configsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    base_price_paise?: boolean
    employee_cap?: boolean
    per_employee_excess_paise?: boolean
    discount_base_pct?: boolean
    discount_module_pct?: boolean
    discount_bundle_pct?: boolean
    bundle_trigger_count?: boolean
    discount_tenure_pct?: boolean
    tenure_months?: boolean
    offer_flat_paise?: boolean
    offer_expiry_date?: boolean
    is_stackable?: boolean
    final_override_paise?: boolean
    billing_cycle?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_pricing_configs"]>

  export type tenant_pricing_configsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    base_price_paise?: boolean
    employee_cap?: boolean
    per_employee_excess_paise?: boolean
    discount_base_pct?: boolean
    discount_module_pct?: boolean
    discount_bundle_pct?: boolean
    bundle_trigger_count?: boolean
    discount_tenure_pct?: boolean
    tenure_months?: boolean
    offer_flat_paise?: boolean
    offer_expiry_date?: boolean
    is_stackable?: boolean
    final_override_paise?: boolean
    billing_cycle?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["tenant_pricing_configs"]>

  export type tenant_pricing_configsSelectScalar = {
    id?: boolean
    tenant_id?: boolean
    base_price_paise?: boolean
    employee_cap?: boolean
    per_employee_excess_paise?: boolean
    discount_base_pct?: boolean
    discount_module_pct?: boolean
    discount_bundle_pct?: boolean
    bundle_trigger_count?: boolean
    discount_tenure_pct?: boolean
    tenure_months?: boolean
    offer_flat_paise?: boolean
    offer_expiry_date?: boolean
    is_stackable?: boolean
    final_override_paise?: boolean
    billing_cycle?: boolean
    updated_at?: boolean
  }

  export type tenant_pricing_configsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenant_id" | "base_price_paise" | "employee_cap" | "per_employee_excess_paise" | "discount_base_pct" | "discount_module_pct" | "discount_bundle_pct" | "bundle_trigger_count" | "discount_tenure_pct" | "tenure_months" | "offer_flat_paise" | "offer_expiry_date" | "is_stackable" | "final_override_paise" | "billing_cycle" | "updated_at", ExtArgs["result"]["tenant_pricing_configs"]>
  export type tenant_pricing_configsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_pricing_configsIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type tenant_pricing_configsIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $tenant_pricing_configsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "tenant_pricing_configs"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenant_id: string
      base_price_paise: number
      employee_cap: number | null
      per_employee_excess_paise: number | null
      discount_base_pct: Prisma.Decimal | null
      discount_module_pct: Prisma.JsonValue | null
      discount_bundle_pct: Prisma.Decimal | null
      bundle_trigger_count: number | null
      discount_tenure_pct: Prisma.Decimal | null
      tenure_months: number | null
      offer_flat_paise: number | null
      offer_expiry_date: Date | null
      is_stackable: boolean | null
      final_override_paise: number | null
      billing_cycle: string | null
      updated_at: Date | null
    }, ExtArgs["result"]["tenant_pricing_configs"]>
    composites: {}
  }

  type tenant_pricing_configsGetPayload<S extends boolean | null | undefined | tenant_pricing_configsDefaultArgs> = $Result.GetResult<Prisma.$tenant_pricing_configsPayload, S>

  type tenant_pricing_configsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<tenant_pricing_configsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Tenant_pricing_configsCountAggregateInputType | true
    }

  export interface tenant_pricing_configsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['tenant_pricing_configs'], meta: { name: 'tenant_pricing_configs' } }
    /**
     * Find zero or one Tenant_pricing_configs that matches the filter.
     * @param {tenant_pricing_configsFindUniqueArgs} args - Arguments to find a Tenant_pricing_configs
     * @example
     * // Get one Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends tenant_pricing_configsFindUniqueArgs>(args: SelectSubset<T, tenant_pricing_configsFindUniqueArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Tenant_pricing_configs that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {tenant_pricing_configsFindUniqueOrThrowArgs} args - Arguments to find a Tenant_pricing_configs
     * @example
     * // Get one Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends tenant_pricing_configsFindUniqueOrThrowArgs>(args: SelectSubset<T, tenant_pricing_configsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_pricing_configs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsFindFirstArgs} args - Arguments to find a Tenant_pricing_configs
     * @example
     * // Get one Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends tenant_pricing_configsFindFirstArgs>(args?: SelectSubset<T, tenant_pricing_configsFindFirstArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Tenant_pricing_configs that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsFindFirstOrThrowArgs} args - Arguments to find a Tenant_pricing_configs
     * @example
     * // Get one Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends tenant_pricing_configsFindFirstOrThrowArgs>(args?: SelectSubset<T, tenant_pricing_configsFindFirstOrThrowArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tenant_pricing_configs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findMany()
     * 
     * // Get first 10 Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const tenant_pricing_configsWithIdOnly = await prisma.tenant_pricing_configs.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends tenant_pricing_configsFindManyArgs>(args?: SelectSubset<T, tenant_pricing_configsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Tenant_pricing_configs.
     * @param {tenant_pricing_configsCreateArgs} args - Arguments to create a Tenant_pricing_configs.
     * @example
     * // Create one Tenant_pricing_configs
     * const Tenant_pricing_configs = await prisma.tenant_pricing_configs.create({
     *   data: {
     *     // ... data to create a Tenant_pricing_configs
     *   }
     * })
     * 
     */
    create<T extends tenant_pricing_configsCreateArgs>(args: SelectSubset<T, tenant_pricing_configsCreateArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tenant_pricing_configs.
     * @param {tenant_pricing_configsCreateManyArgs} args - Arguments to create many Tenant_pricing_configs.
     * @example
     * // Create many Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends tenant_pricing_configsCreateManyArgs>(args?: SelectSubset<T, tenant_pricing_configsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tenant_pricing_configs and returns the data saved in the database.
     * @param {tenant_pricing_configsCreateManyAndReturnArgs} args - Arguments to create many Tenant_pricing_configs.
     * @example
     * // Create many Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tenant_pricing_configs and only return the `id`
     * const tenant_pricing_configsWithIdOnly = await prisma.tenant_pricing_configs.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends tenant_pricing_configsCreateManyAndReturnArgs>(args?: SelectSubset<T, tenant_pricing_configsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Tenant_pricing_configs.
     * @param {tenant_pricing_configsDeleteArgs} args - Arguments to delete one Tenant_pricing_configs.
     * @example
     * // Delete one Tenant_pricing_configs
     * const Tenant_pricing_configs = await prisma.tenant_pricing_configs.delete({
     *   where: {
     *     // ... filter to delete one Tenant_pricing_configs
     *   }
     * })
     * 
     */
    delete<T extends tenant_pricing_configsDeleteArgs>(args: SelectSubset<T, tenant_pricing_configsDeleteArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Tenant_pricing_configs.
     * @param {tenant_pricing_configsUpdateArgs} args - Arguments to update one Tenant_pricing_configs.
     * @example
     * // Update one Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends tenant_pricing_configsUpdateArgs>(args: SelectSubset<T, tenant_pricing_configsUpdateArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tenant_pricing_configs.
     * @param {tenant_pricing_configsDeleteManyArgs} args - Arguments to filter Tenant_pricing_configs to delete.
     * @example
     * // Delete a few Tenant_pricing_configs
     * const { count } = await prisma.tenant_pricing_configs.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends tenant_pricing_configsDeleteManyArgs>(args?: SelectSubset<T, tenant_pricing_configsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_pricing_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends tenant_pricing_configsUpdateManyArgs>(args: SelectSubset<T, tenant_pricing_configsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tenant_pricing_configs and returns the data updated in the database.
     * @param {tenant_pricing_configsUpdateManyAndReturnArgs} args - Arguments to update many Tenant_pricing_configs.
     * @example
     * // Update many Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tenant_pricing_configs and only return the `id`
     * const tenant_pricing_configsWithIdOnly = await prisma.tenant_pricing_configs.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends tenant_pricing_configsUpdateManyAndReturnArgs>(args: SelectSubset<T, tenant_pricing_configsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Tenant_pricing_configs.
     * @param {tenant_pricing_configsUpsertArgs} args - Arguments to update or create a Tenant_pricing_configs.
     * @example
     * // Update or create a Tenant_pricing_configs
     * const tenant_pricing_configs = await prisma.tenant_pricing_configs.upsert({
     *   create: {
     *     // ... data to create a Tenant_pricing_configs
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Tenant_pricing_configs we want to update
     *   }
     * })
     */
    upsert<T extends tenant_pricing_configsUpsertArgs>(args: SelectSubset<T, tenant_pricing_configsUpsertArgs<ExtArgs>>): Prisma__tenant_pricing_configsClient<$Result.GetResult<Prisma.$tenant_pricing_configsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tenant_pricing_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsCountArgs} args - Arguments to filter Tenant_pricing_configs to count.
     * @example
     * // Count the number of Tenant_pricing_configs
     * const count = await prisma.tenant_pricing_configs.count({
     *   where: {
     *     // ... the filter for the Tenant_pricing_configs we want to count
     *   }
     * })
    **/
    count<T extends tenant_pricing_configsCountArgs>(
      args?: Subset<T, tenant_pricing_configsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Tenant_pricing_configsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Tenant_pricing_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Tenant_pricing_configsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Tenant_pricing_configsAggregateArgs>(args: Subset<T, Tenant_pricing_configsAggregateArgs>): Prisma.PrismaPromise<GetTenant_pricing_configsAggregateType<T>>

    /**
     * Group by Tenant_pricing_configs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {tenant_pricing_configsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends tenant_pricing_configsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: tenant_pricing_configsGroupByArgs['orderBy'] }
        : { orderBy?: tenant_pricing_configsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, tenant_pricing_configsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTenant_pricing_configsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the tenant_pricing_configs model
   */
  readonly fields: tenant_pricing_configsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for tenant_pricing_configs.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__tenant_pricing_configsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the tenant_pricing_configs model
   */
  interface tenant_pricing_configsFieldRefs {
    readonly id: FieldRef<"tenant_pricing_configs", 'String'>
    readonly tenant_id: FieldRef<"tenant_pricing_configs", 'String'>
    readonly base_price_paise: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly employee_cap: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly per_employee_excess_paise: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly discount_base_pct: FieldRef<"tenant_pricing_configs", 'Decimal'>
    readonly discount_module_pct: FieldRef<"tenant_pricing_configs", 'Json'>
    readonly discount_bundle_pct: FieldRef<"tenant_pricing_configs", 'Decimal'>
    readonly bundle_trigger_count: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly discount_tenure_pct: FieldRef<"tenant_pricing_configs", 'Decimal'>
    readonly tenure_months: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly offer_flat_paise: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly offer_expiry_date: FieldRef<"tenant_pricing_configs", 'DateTime'>
    readonly is_stackable: FieldRef<"tenant_pricing_configs", 'Boolean'>
    readonly final_override_paise: FieldRef<"tenant_pricing_configs", 'Int'>
    readonly billing_cycle: FieldRef<"tenant_pricing_configs", 'String'>
    readonly updated_at: FieldRef<"tenant_pricing_configs", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * tenant_pricing_configs findUnique
   */
  export type tenant_pricing_configsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter, which tenant_pricing_configs to fetch.
     */
    where: tenant_pricing_configsWhereUniqueInput
  }

  /**
   * tenant_pricing_configs findUniqueOrThrow
   */
  export type tenant_pricing_configsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter, which tenant_pricing_configs to fetch.
     */
    where: tenant_pricing_configsWhereUniqueInput
  }

  /**
   * tenant_pricing_configs findFirst
   */
  export type tenant_pricing_configsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter, which tenant_pricing_configs to fetch.
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_pricing_configs to fetch.
     */
    orderBy?: tenant_pricing_configsOrderByWithRelationInput | tenant_pricing_configsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_pricing_configs.
     */
    cursor?: tenant_pricing_configsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_pricing_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_pricing_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_pricing_configs.
     */
    distinct?: Tenant_pricing_configsScalarFieldEnum | Tenant_pricing_configsScalarFieldEnum[]
  }

  /**
   * tenant_pricing_configs findFirstOrThrow
   */
  export type tenant_pricing_configsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter, which tenant_pricing_configs to fetch.
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_pricing_configs to fetch.
     */
    orderBy?: tenant_pricing_configsOrderByWithRelationInput | tenant_pricing_configsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for tenant_pricing_configs.
     */
    cursor?: tenant_pricing_configsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_pricing_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_pricing_configs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of tenant_pricing_configs.
     */
    distinct?: Tenant_pricing_configsScalarFieldEnum | Tenant_pricing_configsScalarFieldEnum[]
  }

  /**
   * tenant_pricing_configs findMany
   */
  export type tenant_pricing_configsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter, which tenant_pricing_configs to fetch.
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of tenant_pricing_configs to fetch.
     */
    orderBy?: tenant_pricing_configsOrderByWithRelationInput | tenant_pricing_configsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing tenant_pricing_configs.
     */
    cursor?: tenant_pricing_configsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` tenant_pricing_configs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` tenant_pricing_configs.
     */
    skip?: number
    distinct?: Tenant_pricing_configsScalarFieldEnum | Tenant_pricing_configsScalarFieldEnum[]
  }

  /**
   * tenant_pricing_configs create
   */
  export type tenant_pricing_configsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * The data needed to create a tenant_pricing_configs.
     */
    data: XOR<tenant_pricing_configsCreateInput, tenant_pricing_configsUncheckedCreateInput>
  }

  /**
   * tenant_pricing_configs createMany
   */
  export type tenant_pricing_configsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many tenant_pricing_configs.
     */
    data: tenant_pricing_configsCreateManyInput | tenant_pricing_configsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * tenant_pricing_configs createManyAndReturn
   */
  export type tenant_pricing_configsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * The data used to create many tenant_pricing_configs.
     */
    data: tenant_pricing_configsCreateManyInput | tenant_pricing_configsCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_pricing_configs update
   */
  export type tenant_pricing_configsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * The data needed to update a tenant_pricing_configs.
     */
    data: XOR<tenant_pricing_configsUpdateInput, tenant_pricing_configsUncheckedUpdateInput>
    /**
     * Choose, which tenant_pricing_configs to update.
     */
    where: tenant_pricing_configsWhereUniqueInput
  }

  /**
   * tenant_pricing_configs updateMany
   */
  export type tenant_pricing_configsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update tenant_pricing_configs.
     */
    data: XOR<tenant_pricing_configsUpdateManyMutationInput, tenant_pricing_configsUncheckedUpdateManyInput>
    /**
     * Filter which tenant_pricing_configs to update
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * Limit how many tenant_pricing_configs to update.
     */
    limit?: number
  }

  /**
   * tenant_pricing_configs updateManyAndReturn
   */
  export type tenant_pricing_configsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * The data used to update tenant_pricing_configs.
     */
    data: XOR<tenant_pricing_configsUpdateManyMutationInput, tenant_pricing_configsUncheckedUpdateManyInput>
    /**
     * Filter which tenant_pricing_configs to update
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * Limit how many tenant_pricing_configs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * tenant_pricing_configs upsert
   */
  export type tenant_pricing_configsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * The filter to search for the tenant_pricing_configs to update in case it exists.
     */
    where: tenant_pricing_configsWhereUniqueInput
    /**
     * In case the tenant_pricing_configs found by the `where` argument doesn't exist, create a new tenant_pricing_configs with this data.
     */
    create: XOR<tenant_pricing_configsCreateInput, tenant_pricing_configsUncheckedCreateInput>
    /**
     * In case the tenant_pricing_configs was found with the provided `where` argument, update it with this data.
     */
    update: XOR<tenant_pricing_configsUpdateInput, tenant_pricing_configsUncheckedUpdateInput>
  }

  /**
   * tenant_pricing_configs delete
   */
  export type tenant_pricing_configsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
    /**
     * Filter which tenant_pricing_configs to delete.
     */
    where: tenant_pricing_configsWhereUniqueInput
  }

  /**
   * tenant_pricing_configs deleteMany
   */
  export type tenant_pricing_configsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which tenant_pricing_configs to delete
     */
    where?: tenant_pricing_configsWhereInput
    /**
     * Limit how many tenant_pricing_configs to delete.
     */
    limit?: number
  }

  /**
   * tenant_pricing_configs without action
   */
  export type tenant_pricing_configsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the tenant_pricing_configs
     */
    select?: tenant_pricing_configsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the tenant_pricing_configs
     */
    omit?: tenant_pricing_configsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: tenant_pricing_configsInclude<ExtArgs> | null
  }


  /**
   * Model invoices
   */

  export type AggregateInvoices = {
    _count: InvoicesCountAggregateOutputType | null
    _avg: InvoicesAvgAggregateOutputType | null
    _sum: InvoicesSumAggregateOutputType | null
    _min: InvoicesMinAggregateOutputType | null
    _max: InvoicesMaxAggregateOutputType | null
  }

  export type InvoicesAvgAggregateOutputType = {
    base_amount_paise: number | null
    module_amount_paise: number | null
    excess_amount_paise: number | null
    discount_amount_paise: number | null
    tax_amount_paise: number | null
    total_paise: number | null
  }

  export type InvoicesSumAggregateOutputType = {
    base_amount_paise: number | null
    module_amount_paise: number | null
    excess_amount_paise: number | null
    discount_amount_paise: number | null
    tax_amount_paise: number | null
    total_paise: number | null
  }

  export type InvoicesMinAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    invoice_no: string | null
    period_start: Date | null
    period_end: Date | null
    issue_date: Date | null
    due_date: Date | null
    base_amount_paise: number | null
    module_amount_paise: number | null
    excess_amount_paise: number | null
    discount_amount_paise: number | null
    tax_amount_paise: number | null
    total_paise: number | null
    currency: string | null
    status: string | null
    pdf_url: string | null
    payment_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type InvoicesMaxAggregateOutputType = {
    id: string | null
    tenant_id: string | null
    invoice_no: string | null
    period_start: Date | null
    period_end: Date | null
    issue_date: Date | null
    due_date: Date | null
    base_amount_paise: number | null
    module_amount_paise: number | null
    excess_amount_paise: number | null
    discount_amount_paise: number | null
    tax_amount_paise: number | null
    total_paise: number | null
    currency: string | null
    status: string | null
    pdf_url: string | null
    payment_id: string | null
    created_at: Date | null
    updated_at: Date | null
  }

  export type InvoicesCountAggregateOutputType = {
    id: number
    tenant_id: number
    invoice_no: number
    period_start: number
    period_end: number
    issue_date: number
    due_date: number
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise: number
    total_paise: number
    currency: number
    status: number
    breakdown: number
    pdf_url: number
    payment_id: number
    created_at: number
    updated_at: number
    _all: number
  }


  export type InvoicesAvgAggregateInputType = {
    base_amount_paise?: true
    module_amount_paise?: true
    excess_amount_paise?: true
    discount_amount_paise?: true
    tax_amount_paise?: true
    total_paise?: true
  }

  export type InvoicesSumAggregateInputType = {
    base_amount_paise?: true
    module_amount_paise?: true
    excess_amount_paise?: true
    discount_amount_paise?: true
    tax_amount_paise?: true
    total_paise?: true
  }

  export type InvoicesMinAggregateInputType = {
    id?: true
    tenant_id?: true
    invoice_no?: true
    period_start?: true
    period_end?: true
    issue_date?: true
    due_date?: true
    base_amount_paise?: true
    module_amount_paise?: true
    excess_amount_paise?: true
    discount_amount_paise?: true
    tax_amount_paise?: true
    total_paise?: true
    currency?: true
    status?: true
    pdf_url?: true
    payment_id?: true
    created_at?: true
    updated_at?: true
  }

  export type InvoicesMaxAggregateInputType = {
    id?: true
    tenant_id?: true
    invoice_no?: true
    period_start?: true
    period_end?: true
    issue_date?: true
    due_date?: true
    base_amount_paise?: true
    module_amount_paise?: true
    excess_amount_paise?: true
    discount_amount_paise?: true
    tax_amount_paise?: true
    total_paise?: true
    currency?: true
    status?: true
    pdf_url?: true
    payment_id?: true
    created_at?: true
    updated_at?: true
  }

  export type InvoicesCountAggregateInputType = {
    id?: true
    tenant_id?: true
    invoice_no?: true
    period_start?: true
    period_end?: true
    issue_date?: true
    due_date?: true
    base_amount_paise?: true
    module_amount_paise?: true
    excess_amount_paise?: true
    discount_amount_paise?: true
    tax_amount_paise?: true
    total_paise?: true
    currency?: true
    status?: true
    breakdown?: true
    pdf_url?: true
    payment_id?: true
    created_at?: true
    updated_at?: true
    _all?: true
  }

  export type InvoicesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which invoices to aggregate.
     */
    where?: invoicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of invoices to fetch.
     */
    orderBy?: invoicesOrderByWithRelationInput | invoicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: invoicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned invoices
    **/
    _count?: true | InvoicesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoicesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoicesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoicesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoicesMaxAggregateInputType
  }

  export type GetInvoicesAggregateType<T extends InvoicesAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoices]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoices[P]>
      : GetScalarType<T[P], AggregateInvoices[P]>
  }



  export type invoicesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: invoicesWhereInput
    orderBy?: invoicesOrderByWithAggregationInput | invoicesOrderByWithAggregationInput[]
    by: InvoicesScalarFieldEnum[] | InvoicesScalarFieldEnum
    having?: invoicesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoicesCountAggregateInputType | true
    _avg?: InvoicesAvgAggregateInputType
    _sum?: InvoicesSumAggregateInputType
    _min?: InvoicesMinAggregateInputType
    _max?: InvoicesMaxAggregateInputType
  }

  export type InvoicesGroupByOutputType = {
    id: string
    tenant_id: string
    invoice_no: string
    period_start: Date
    period_end: Date
    issue_date: Date
    due_date: Date
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise: number
    total_paise: number
    currency: string
    status: string
    breakdown: JsonValue | null
    pdf_url: string | null
    payment_id: string | null
    created_at: Date
    updated_at: Date
    _count: InvoicesCountAggregateOutputType | null
    _avg: InvoicesAvgAggregateOutputType | null
    _sum: InvoicesSumAggregateOutputType | null
    _min: InvoicesMinAggregateOutputType | null
    _max: InvoicesMaxAggregateOutputType | null
  }

  type GetInvoicesGroupByPayload<T extends invoicesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoicesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoicesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoicesGroupByOutputType[P]>
            : GetScalarType<T[P], InvoicesGroupByOutputType[P]>
        }
      >
    >


  export type invoicesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    invoice_no?: boolean
    period_start?: boolean
    period_end?: boolean
    issue_date?: boolean
    due_date?: boolean
    base_amount_paise?: boolean
    module_amount_paise?: boolean
    excess_amount_paise?: boolean
    discount_amount_paise?: boolean
    tax_amount_paise?: boolean
    total_paise?: boolean
    currency?: boolean
    status?: boolean
    breakdown?: boolean
    pdf_url?: boolean
    payment_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoices"]>

  export type invoicesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    invoice_no?: boolean
    period_start?: boolean
    period_end?: boolean
    issue_date?: boolean
    due_date?: boolean
    base_amount_paise?: boolean
    module_amount_paise?: boolean
    excess_amount_paise?: boolean
    discount_amount_paise?: boolean
    tax_amount_paise?: boolean
    total_paise?: boolean
    currency?: boolean
    status?: boolean
    breakdown?: boolean
    pdf_url?: boolean
    payment_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoices"]>

  export type invoicesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    tenant_id?: boolean
    invoice_no?: boolean
    period_start?: boolean
    period_end?: boolean
    issue_date?: boolean
    due_date?: boolean
    base_amount_paise?: boolean
    module_amount_paise?: boolean
    excess_amount_paise?: boolean
    discount_amount_paise?: boolean
    tax_amount_paise?: boolean
    total_paise?: boolean
    currency?: boolean
    status?: boolean
    breakdown?: boolean
    pdf_url?: boolean
    payment_id?: boolean
    created_at?: boolean
    updated_at?: boolean
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["invoices"]>

  export type invoicesSelectScalar = {
    id?: boolean
    tenant_id?: boolean
    invoice_no?: boolean
    period_start?: boolean
    period_end?: boolean
    issue_date?: boolean
    due_date?: boolean
    base_amount_paise?: boolean
    module_amount_paise?: boolean
    excess_amount_paise?: boolean
    discount_amount_paise?: boolean
    tax_amount_paise?: boolean
    total_paise?: boolean
    currency?: boolean
    status?: boolean
    breakdown?: boolean
    pdf_url?: boolean
    payment_id?: boolean
    created_at?: boolean
    updated_at?: boolean
  }

  export type invoicesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "tenant_id" | "invoice_no" | "period_start" | "period_end" | "issue_date" | "due_date" | "base_amount_paise" | "module_amount_paise" | "excess_amount_paise" | "discount_amount_paise" | "tax_amount_paise" | "total_paise" | "currency" | "status" | "breakdown" | "pdf_url" | "payment_id" | "created_at" | "updated_at", ExtArgs["result"]["invoices"]>
  export type invoicesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type invoicesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }
  export type invoicesIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tenant?: boolean | tenantsDefaultArgs<ExtArgs>
  }

  export type $invoicesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "invoices"
    objects: {
      tenant: Prisma.$tenantsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      tenant_id: string
      invoice_no: string
      period_start: Date
      period_end: Date
      issue_date: Date
      due_date: Date
      base_amount_paise: number
      module_amount_paise: number
      excess_amount_paise: number
      discount_amount_paise: number
      tax_amount_paise: number
      total_paise: number
      currency: string
      status: string
      breakdown: Prisma.JsonValue | null
      pdf_url: string | null
      payment_id: string | null
      created_at: Date
      updated_at: Date
    }, ExtArgs["result"]["invoices"]>
    composites: {}
  }

  type invoicesGetPayload<S extends boolean | null | undefined | invoicesDefaultArgs> = $Result.GetResult<Prisma.$invoicesPayload, S>

  type invoicesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<invoicesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvoicesCountAggregateInputType | true
    }

  export interface invoicesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['invoices'], meta: { name: 'invoices' } }
    /**
     * Find zero or one Invoices that matches the filter.
     * @param {invoicesFindUniqueArgs} args - Arguments to find a Invoices
     * @example
     * // Get one Invoices
     * const invoices = await prisma.invoices.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends invoicesFindUniqueArgs>(args: SelectSubset<T, invoicesFindUniqueArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Invoices that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {invoicesFindUniqueOrThrowArgs} args - Arguments to find a Invoices
     * @example
     * // Get one Invoices
     * const invoices = await prisma.invoices.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends invoicesFindUniqueOrThrowArgs>(args: SelectSubset<T, invoicesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesFindFirstArgs} args - Arguments to find a Invoices
     * @example
     * // Get one Invoices
     * const invoices = await prisma.invoices.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends invoicesFindFirstArgs>(args?: SelectSubset<T, invoicesFindFirstArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoices that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesFindFirstOrThrowArgs} args - Arguments to find a Invoices
     * @example
     * // Get one Invoices
     * const invoices = await prisma.invoices.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends invoicesFindFirstOrThrowArgs>(args?: SelectSubset<T, invoicesFindFirstOrThrowArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invoices
     * const invoices = await prisma.invoices.findMany()
     * 
     * // Get first 10 Invoices
     * const invoices = await prisma.invoices.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoicesWithIdOnly = await prisma.invoices.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends invoicesFindManyArgs>(args?: SelectSubset<T, invoicesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Invoices.
     * @param {invoicesCreateArgs} args - Arguments to create a Invoices.
     * @example
     * // Create one Invoices
     * const Invoices = await prisma.invoices.create({
     *   data: {
     *     // ... data to create a Invoices
     *   }
     * })
     * 
     */
    create<T extends invoicesCreateArgs>(args: SelectSubset<T, invoicesCreateArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Invoices.
     * @param {invoicesCreateManyArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoices = await prisma.invoices.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends invoicesCreateManyArgs>(args?: SelectSubset<T, invoicesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invoices and returns the data saved in the database.
     * @param {invoicesCreateManyAndReturnArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoices = await prisma.invoices.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invoices and only return the `id`
     * const invoicesWithIdOnly = await prisma.invoices.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends invoicesCreateManyAndReturnArgs>(args?: SelectSubset<T, invoicesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Invoices.
     * @param {invoicesDeleteArgs} args - Arguments to delete one Invoices.
     * @example
     * // Delete one Invoices
     * const Invoices = await prisma.invoices.delete({
     *   where: {
     *     // ... filter to delete one Invoices
     *   }
     * })
     * 
     */
    delete<T extends invoicesDeleteArgs>(args: SelectSubset<T, invoicesDeleteArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Invoices.
     * @param {invoicesUpdateArgs} args - Arguments to update one Invoices.
     * @example
     * // Update one Invoices
     * const invoices = await prisma.invoices.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends invoicesUpdateArgs>(args: SelectSubset<T, invoicesUpdateArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Invoices.
     * @param {invoicesDeleteManyArgs} args - Arguments to filter Invoices to delete.
     * @example
     * // Delete a few Invoices
     * const { count } = await prisma.invoices.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends invoicesDeleteManyArgs>(args?: SelectSubset<T, invoicesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invoices
     * const invoices = await prisma.invoices.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends invoicesUpdateManyArgs>(args: SelectSubset<T, invoicesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices and returns the data updated in the database.
     * @param {invoicesUpdateManyAndReturnArgs} args - Arguments to update many Invoices.
     * @example
     * // Update many Invoices
     * const invoices = await prisma.invoices.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Invoices and only return the `id`
     * const invoicesWithIdOnly = await prisma.invoices.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends invoicesUpdateManyAndReturnArgs>(args: SelectSubset<T, invoicesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Invoices.
     * @param {invoicesUpsertArgs} args - Arguments to update or create a Invoices.
     * @example
     * // Update or create a Invoices
     * const invoices = await prisma.invoices.upsert({
     *   create: {
     *     // ... data to create a Invoices
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invoices we want to update
     *   }
     * })
     */
    upsert<T extends invoicesUpsertArgs>(args: SelectSubset<T, invoicesUpsertArgs<ExtArgs>>): Prisma__invoicesClient<$Result.GetResult<Prisma.$invoicesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesCountArgs} args - Arguments to filter Invoices to count.
     * @example
     * // Count the number of Invoices
     * const count = await prisma.invoices.count({
     *   where: {
     *     // ... the filter for the Invoices we want to count
     *   }
     * })
    **/
    count<T extends invoicesCountArgs>(
      args?: Subset<T, invoicesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoicesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoicesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvoicesAggregateArgs>(args: Subset<T, InvoicesAggregateArgs>): Prisma.PrismaPromise<GetInvoicesAggregateType<T>>

    /**
     * Group by Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {invoicesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends invoicesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: invoicesGroupByArgs['orderBy'] }
        : { orderBy?: invoicesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, invoicesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoicesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the invoices model
   */
  readonly fields: invoicesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for invoices.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__invoicesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tenant<T extends tenantsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, tenantsDefaultArgs<ExtArgs>>): Prisma__tenantsClient<$Result.GetResult<Prisma.$tenantsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the invoices model
   */
  interface invoicesFieldRefs {
    readonly id: FieldRef<"invoices", 'String'>
    readonly tenant_id: FieldRef<"invoices", 'String'>
    readonly invoice_no: FieldRef<"invoices", 'String'>
    readonly period_start: FieldRef<"invoices", 'DateTime'>
    readonly period_end: FieldRef<"invoices", 'DateTime'>
    readonly issue_date: FieldRef<"invoices", 'DateTime'>
    readonly due_date: FieldRef<"invoices", 'DateTime'>
    readonly base_amount_paise: FieldRef<"invoices", 'Int'>
    readonly module_amount_paise: FieldRef<"invoices", 'Int'>
    readonly excess_amount_paise: FieldRef<"invoices", 'Int'>
    readonly discount_amount_paise: FieldRef<"invoices", 'Int'>
    readonly tax_amount_paise: FieldRef<"invoices", 'Int'>
    readonly total_paise: FieldRef<"invoices", 'Int'>
    readonly currency: FieldRef<"invoices", 'String'>
    readonly status: FieldRef<"invoices", 'String'>
    readonly breakdown: FieldRef<"invoices", 'Json'>
    readonly pdf_url: FieldRef<"invoices", 'String'>
    readonly payment_id: FieldRef<"invoices", 'String'>
    readonly created_at: FieldRef<"invoices", 'DateTime'>
    readonly updated_at: FieldRef<"invoices", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * invoices findUnique
   */
  export type invoicesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter, which invoices to fetch.
     */
    where: invoicesWhereUniqueInput
  }

  /**
   * invoices findUniqueOrThrow
   */
  export type invoicesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter, which invoices to fetch.
     */
    where: invoicesWhereUniqueInput
  }

  /**
   * invoices findFirst
   */
  export type invoicesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter, which invoices to fetch.
     */
    where?: invoicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of invoices to fetch.
     */
    orderBy?: invoicesOrderByWithRelationInput | invoicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for invoices.
     */
    cursor?: invoicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of invoices.
     */
    distinct?: InvoicesScalarFieldEnum | InvoicesScalarFieldEnum[]
  }

  /**
   * invoices findFirstOrThrow
   */
  export type invoicesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter, which invoices to fetch.
     */
    where?: invoicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of invoices to fetch.
     */
    orderBy?: invoicesOrderByWithRelationInput | invoicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for invoices.
     */
    cursor?: invoicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of invoices.
     */
    distinct?: InvoicesScalarFieldEnum | InvoicesScalarFieldEnum[]
  }

  /**
   * invoices findMany
   */
  export type invoicesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter, which invoices to fetch.
     */
    where?: invoicesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of invoices to fetch.
     */
    orderBy?: invoicesOrderByWithRelationInput | invoicesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing invoices.
     */
    cursor?: invoicesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` invoices.
     */
    skip?: number
    distinct?: InvoicesScalarFieldEnum | InvoicesScalarFieldEnum[]
  }

  /**
   * invoices create
   */
  export type invoicesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * The data needed to create a invoices.
     */
    data: XOR<invoicesCreateInput, invoicesUncheckedCreateInput>
  }

  /**
   * invoices createMany
   */
  export type invoicesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many invoices.
     */
    data: invoicesCreateManyInput | invoicesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * invoices createManyAndReturn
   */
  export type invoicesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * The data used to create many invoices.
     */
    data: invoicesCreateManyInput | invoicesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * invoices update
   */
  export type invoicesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * The data needed to update a invoices.
     */
    data: XOR<invoicesUpdateInput, invoicesUncheckedUpdateInput>
    /**
     * Choose, which invoices to update.
     */
    where: invoicesWhereUniqueInput
  }

  /**
   * invoices updateMany
   */
  export type invoicesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update invoices.
     */
    data: XOR<invoicesUpdateManyMutationInput, invoicesUncheckedUpdateManyInput>
    /**
     * Filter which invoices to update
     */
    where?: invoicesWhereInput
    /**
     * Limit how many invoices to update.
     */
    limit?: number
  }

  /**
   * invoices updateManyAndReturn
   */
  export type invoicesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * The data used to update invoices.
     */
    data: XOR<invoicesUpdateManyMutationInput, invoicesUncheckedUpdateManyInput>
    /**
     * Filter which invoices to update
     */
    where?: invoicesWhereInput
    /**
     * Limit how many invoices to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * invoices upsert
   */
  export type invoicesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * The filter to search for the invoices to update in case it exists.
     */
    where: invoicesWhereUniqueInput
    /**
     * In case the invoices found by the `where` argument doesn't exist, create a new invoices with this data.
     */
    create: XOR<invoicesCreateInput, invoicesUncheckedCreateInput>
    /**
     * In case the invoices was found with the provided `where` argument, update it with this data.
     */
    update: XOR<invoicesUpdateInput, invoicesUncheckedUpdateInput>
  }

  /**
   * invoices delete
   */
  export type invoicesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
    /**
     * Filter which invoices to delete.
     */
    where: invoicesWhereUniqueInput
  }

  /**
   * invoices deleteMany
   */
  export type invoicesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which invoices to delete
     */
    where?: invoicesWhereInput
    /**
     * Limit how many invoices to delete.
     */
    limit?: number
  }

  /**
   * invoices without action
   */
  export type invoicesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the invoices
     */
    select?: invoicesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the invoices
     */
    omit?: invoicesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: invoicesInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TenantsScalarFieldEnum: {
    id: 'id',
    name: 'name',
    legal_name: 'legal_name',
    subdomain: 'subdomain',
    custom_domain: 'custom_domain',
    logo_url: 'logo_url',
    primary_color: 'primary_color',
    background_color: 'background_color',
    background_url: 'background_url',
    sitemap_url: 'sitemap_url',
    plan: 'plan',
    plan_expires_at: 'plan_expires_at',
    max_employees: 'max_employees',
    db_mode: 'db_mode',
    db_url: 'db_url',
    schema_name: 'schema_name',
    local_db_type: 'local_db_type',
    local_db_host: 'local_db_host',
    local_db_port: 'local_db_port',
    local_db_name: 'local_db_name',
    local_db_user: 'local_db_user',
    local_db_pass: 'local_db_pass',
    sync_interval_min: 'sync_interval_min',
    gstin: 'gstin',
    pan: 'pan',
    city: 'city',
    state: 'state',
    address: 'address',
    pincode: 'pincode',
    gst_status: 'gst_status',
    gst_reg_date: 'gst_reg_date',
    taxpayer_type: 'taxpayer_type',
    constitution: 'constitution',
    e_invoice_enabled: 'e_invoice_enabled',
    business_nature: 'business_nature',
    admin_name: 'admin_name',
    admin_email: 'admin_email',
    admin_phone: 'admin_phone',
    is_active: 'is_active',
    is_setup_complete: 'is_setup_complete',
    suspended_at: 'suspended_at',
    suspension_reason: 'suspension_reason',
    payout_config_enc: 'payout_config_enc',
    created_at: 'created_at',
    updated_at: 'updated_at',
    deleted_at: 'deleted_at'
  };

  export type TenantsScalarFieldEnum = (typeof TenantsScalarFieldEnum)[keyof typeof TenantsScalarFieldEnum]


  export const Tenant_modulesScalarFieldEnum: {
    id: 'id',
    tenant_id: 'tenant_id',
    module_name: 'module_name',
    is_active: 'is_active',
    custom_price_paise: 'custom_price_paise',
    enabled_at: 'enabled_at',
    disabled_at: 'disabled_at'
  };

  export type Tenant_modulesScalarFieldEnum = (typeof Tenant_modulesScalarFieldEnum)[keyof typeof Tenant_modulesScalarFieldEnum]


  export const Central_user_indexScalarFieldEnum: {
    id: 'id',
    email: 'email',
    subdomain: 'subdomain',
    company_id: 'company_id',
    user_id: 'user_id',
    is_platform_admin: 'is_platform_admin',
    is_active: 'is_active',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type Central_user_indexScalarFieldEnum = (typeof Central_user_indexScalarFieldEnum)[keyof typeof Central_user_indexScalarFieldEnum]


  export const Tenant_branch_linksScalarFieldEnum: {
    id: 'id',
    tenant_id: 'tenant_id',
    gstin: 'gstin',
    pan: 'pan',
    branch_name: 'branch_name',
    branch_no: 'branch_no',
    address: 'address',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    status: 'status',
    requested_at: 'requested_at',
    approved_at: 'approved_at',
    note: 'note'
  };

  export type Tenant_branch_linksScalarFieldEnum = (typeof Tenant_branch_linksScalarFieldEnum)[keyof typeof Tenant_branch_linksScalarFieldEnum]


  export const Central_kyc_recordsScalarFieldEnum: {
    id: 'id',
    aadhaar_hash: 'aadhaar_hash',
    method: 'method',
    kyc_timestamp: 'kyc_timestamp',
    name: 'name',
    dob: 'dob',
    gender: 'gender',
    careof: 'careof',
    mobile_encrypted: 'mobile_encrypted',
    email_encrypted: 'email_encrypted',
    house: 'house',
    street: 'street',
    loc: 'loc',
    vtc: 'vtc',
    po: 'po',
    subdist: 'subdist',
    dist: 'dist',
    state: 'state',
    country: 'country',
    pc: 'pc',
    pht: 'pht',
    task_id: 'task_id',
    created_at: 'created_at'
  };

  export type Central_kyc_recordsScalarFieldEnum = (typeof Central_kyc_recordsScalarFieldEnum)[keyof typeof Central_kyc_recordsScalarFieldEnum]


  export const Central_gst_recordsScalarFieldEnum: {
    id: 'id',
    gstin: 'gstin',
    pan: 'pan',
    company_name: 'company_name',
    legal_name: 'legal_name',
    trade_name: 'trade_name',
    state: 'state',
    state_code: 'state_code',
    gst_status: 'gst_status',
    gst_reg_date: 'gst_reg_date',
    taxpayer_type: 'taxpayer_type',
    constitution: 'constitution',
    business_nature: 'business_nature',
    dealing_in: 'dealing_in',
    address: 'address',
    city: 'city',
    pincode: 'pincode',
    location: 'location',
    district: 'district',
    branch_no: 'branch_no',
    branch_name: 'branch_name',
    flat_no: 'flat_no',
    street: 'street',
    centre_jurisdiction: 'centre_jurisdiction',
    centre_code: 'centre_code',
    state_jurisdiction: 'state_jurisdiction',
    cancellation_date: 'cancellation_date',
    data_source: 'data_source',
    raw: 'raw',
    created_at: 'created_at'
  };

  export type Central_gst_recordsScalarFieldEnum = (typeof Central_gst_recordsScalarFieldEnum)[keyof typeof Central_gst_recordsScalarFieldEnum]


  export const Platform_settingsScalarFieldEnum: {
    id: 'id',
    values: 'values',
    updated_at: 'updated_at'
  };

  export type Platform_settingsScalarFieldEnum = (typeof Platform_settingsScalarFieldEnum)[keyof typeof Platform_settingsScalarFieldEnum]


  export const Tenant_pricing_configsScalarFieldEnum: {
    id: 'id',
    tenant_id: 'tenant_id',
    base_price_paise: 'base_price_paise',
    employee_cap: 'employee_cap',
    per_employee_excess_paise: 'per_employee_excess_paise',
    discount_base_pct: 'discount_base_pct',
    discount_module_pct: 'discount_module_pct',
    discount_bundle_pct: 'discount_bundle_pct',
    bundle_trigger_count: 'bundle_trigger_count',
    discount_tenure_pct: 'discount_tenure_pct',
    tenure_months: 'tenure_months',
    offer_flat_paise: 'offer_flat_paise',
    offer_expiry_date: 'offer_expiry_date',
    is_stackable: 'is_stackable',
    final_override_paise: 'final_override_paise',
    billing_cycle: 'billing_cycle',
    updated_at: 'updated_at'
  };

  export type Tenant_pricing_configsScalarFieldEnum = (typeof Tenant_pricing_configsScalarFieldEnum)[keyof typeof Tenant_pricing_configsScalarFieldEnum]


  export const InvoicesScalarFieldEnum: {
    id: 'id',
    tenant_id: 'tenant_id',
    invoice_no: 'invoice_no',
    period_start: 'period_start',
    period_end: 'period_end',
    issue_date: 'issue_date',
    due_date: 'due_date',
    base_amount_paise: 'base_amount_paise',
    module_amount_paise: 'module_amount_paise',
    excess_amount_paise: 'excess_amount_paise',
    discount_amount_paise: 'discount_amount_paise',
    tax_amount_paise: 'tax_amount_paise',
    total_paise: 'total_paise',
    currency: 'currency',
    status: 'status',
    breakdown: 'breakdown',
    pdf_url: 'pdf_url',
    payment_id: 'payment_id',
    created_at: 'created_at',
    updated_at: 'updated_at'
  };

  export type InvoicesScalarFieldEnum = (typeof InvoicesScalarFieldEnum)[keyof typeof InvoicesScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type tenantsWhereInput = {
    AND?: tenantsWhereInput | tenantsWhereInput[]
    OR?: tenantsWhereInput[]
    NOT?: tenantsWhereInput | tenantsWhereInput[]
    id?: UuidFilter<"tenants"> | string
    name?: StringFilter<"tenants"> | string
    legal_name?: StringNullableFilter<"tenants"> | string | null
    subdomain?: StringFilter<"tenants"> | string
    custom_domain?: StringNullableFilter<"tenants"> | string | null
    logo_url?: StringNullableFilter<"tenants"> | string | null
    primary_color?: StringNullableFilter<"tenants"> | string | null
    background_color?: StringNullableFilter<"tenants"> | string | null
    background_url?: StringNullableFilter<"tenants"> | string | null
    sitemap_url?: StringNullableFilter<"tenants"> | string | null
    plan?: StringFilter<"tenants"> | string
    plan_expires_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    max_employees?: IntFilter<"tenants"> | number
    db_mode?: StringFilter<"tenants"> | string
    db_url?: StringNullableFilter<"tenants"> | string | null
    schema_name?: StringNullableFilter<"tenants"> | string | null
    local_db_type?: StringNullableFilter<"tenants"> | string | null
    local_db_host?: StringNullableFilter<"tenants"> | string | null
    local_db_port?: IntNullableFilter<"tenants"> | number | null
    local_db_name?: StringNullableFilter<"tenants"> | string | null
    local_db_user?: StringNullableFilter<"tenants"> | string | null
    local_db_pass?: StringNullableFilter<"tenants"> | string | null
    sync_interval_min?: IntNullableFilter<"tenants"> | number | null
    gstin?: StringNullableFilter<"tenants"> | string | null
    pan?: StringNullableFilter<"tenants"> | string | null
    city?: StringNullableFilter<"tenants"> | string | null
    state?: StringNullableFilter<"tenants"> | string | null
    address?: StringNullableFilter<"tenants"> | string | null
    pincode?: StringNullableFilter<"tenants"> | string | null
    gst_status?: StringNullableFilter<"tenants"> | string | null
    gst_reg_date?: StringNullableFilter<"tenants"> | string | null
    taxpayer_type?: StringNullableFilter<"tenants"> | string | null
    constitution?: StringNullableFilter<"tenants"> | string | null
    e_invoice_enabled?: BoolNullableFilter<"tenants"> | boolean | null
    business_nature?: JsonNullableFilter<"tenants">
    admin_name?: StringNullableFilter<"tenants"> | string | null
    admin_email?: StringNullableFilter<"tenants"> | string | null
    admin_phone?: StringNullableFilter<"tenants"> | string | null
    is_active?: BoolFilter<"tenants"> | boolean
    is_setup_complete?: BoolFilter<"tenants"> | boolean
    suspended_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    suspension_reason?: StringNullableFilter<"tenants"> | string | null
    payout_config_enc?: StringNullableFilter<"tenants"> | string | null
    created_at?: DateTimeFilter<"tenants"> | Date | string
    updated_at?: DateTimeFilter<"tenants"> | Date | string
    deleted_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    tenant_modules?: Tenant_modulesListRelationFilter
    central_user_index?: Central_user_indexListRelationFilter
    tenant_branch_links?: Tenant_branch_linksListRelationFilter
    tenant_pricing_configs?: XOR<Tenant_pricing_configsNullableScalarRelationFilter, tenant_pricing_configsWhereInput> | null
    invoices?: InvoicesListRelationFilter
  }

  export type tenantsOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    legal_name?: SortOrderInput | SortOrder
    subdomain?: SortOrder
    custom_domain?: SortOrderInput | SortOrder
    logo_url?: SortOrderInput | SortOrder
    primary_color?: SortOrderInput | SortOrder
    background_color?: SortOrderInput | SortOrder
    background_url?: SortOrderInput | SortOrder
    sitemap_url?: SortOrderInput | SortOrder
    plan?: SortOrder
    plan_expires_at?: SortOrderInput | SortOrder
    max_employees?: SortOrder
    db_mode?: SortOrder
    db_url?: SortOrderInput | SortOrder
    schema_name?: SortOrderInput | SortOrder
    local_db_type?: SortOrderInput | SortOrder
    local_db_host?: SortOrderInput | SortOrder
    local_db_port?: SortOrderInput | SortOrder
    local_db_name?: SortOrderInput | SortOrder
    local_db_user?: SortOrderInput | SortOrder
    local_db_pass?: SortOrderInput | SortOrder
    sync_interval_min?: SortOrderInput | SortOrder
    gstin?: SortOrderInput | SortOrder
    pan?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    gst_status?: SortOrderInput | SortOrder
    gst_reg_date?: SortOrderInput | SortOrder
    taxpayer_type?: SortOrderInput | SortOrder
    constitution?: SortOrderInput | SortOrder
    e_invoice_enabled?: SortOrderInput | SortOrder
    business_nature?: SortOrderInput | SortOrder
    admin_name?: SortOrderInput | SortOrder
    admin_email?: SortOrderInput | SortOrder
    admin_phone?: SortOrderInput | SortOrder
    is_active?: SortOrder
    is_setup_complete?: SortOrder
    suspended_at?: SortOrderInput | SortOrder
    suspension_reason?: SortOrderInput | SortOrder
    payout_config_enc?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    deleted_at?: SortOrderInput | SortOrder
    tenant_modules?: tenant_modulesOrderByRelationAggregateInput
    central_user_index?: central_user_indexOrderByRelationAggregateInput
    tenant_branch_links?: tenant_branch_linksOrderByRelationAggregateInput
    tenant_pricing_configs?: tenant_pricing_configsOrderByWithRelationInput
    invoices?: invoicesOrderByRelationAggregateInput
  }

  export type tenantsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    subdomain?: string
    custom_domain?: string
    AND?: tenantsWhereInput | tenantsWhereInput[]
    OR?: tenantsWhereInput[]
    NOT?: tenantsWhereInput | tenantsWhereInput[]
    name?: StringFilter<"tenants"> | string
    legal_name?: StringNullableFilter<"tenants"> | string | null
    logo_url?: StringNullableFilter<"tenants"> | string | null
    primary_color?: StringNullableFilter<"tenants"> | string | null
    background_color?: StringNullableFilter<"tenants"> | string | null
    background_url?: StringNullableFilter<"tenants"> | string | null
    sitemap_url?: StringNullableFilter<"tenants"> | string | null
    plan?: StringFilter<"tenants"> | string
    plan_expires_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    max_employees?: IntFilter<"tenants"> | number
    db_mode?: StringFilter<"tenants"> | string
    db_url?: StringNullableFilter<"tenants"> | string | null
    schema_name?: StringNullableFilter<"tenants"> | string | null
    local_db_type?: StringNullableFilter<"tenants"> | string | null
    local_db_host?: StringNullableFilter<"tenants"> | string | null
    local_db_port?: IntNullableFilter<"tenants"> | number | null
    local_db_name?: StringNullableFilter<"tenants"> | string | null
    local_db_user?: StringNullableFilter<"tenants"> | string | null
    local_db_pass?: StringNullableFilter<"tenants"> | string | null
    sync_interval_min?: IntNullableFilter<"tenants"> | number | null
    gstin?: StringNullableFilter<"tenants"> | string | null
    pan?: StringNullableFilter<"tenants"> | string | null
    city?: StringNullableFilter<"tenants"> | string | null
    state?: StringNullableFilter<"tenants"> | string | null
    address?: StringNullableFilter<"tenants"> | string | null
    pincode?: StringNullableFilter<"tenants"> | string | null
    gst_status?: StringNullableFilter<"tenants"> | string | null
    gst_reg_date?: StringNullableFilter<"tenants"> | string | null
    taxpayer_type?: StringNullableFilter<"tenants"> | string | null
    constitution?: StringNullableFilter<"tenants"> | string | null
    e_invoice_enabled?: BoolNullableFilter<"tenants"> | boolean | null
    business_nature?: JsonNullableFilter<"tenants">
    admin_name?: StringNullableFilter<"tenants"> | string | null
    admin_email?: StringNullableFilter<"tenants"> | string | null
    admin_phone?: StringNullableFilter<"tenants"> | string | null
    is_active?: BoolFilter<"tenants"> | boolean
    is_setup_complete?: BoolFilter<"tenants"> | boolean
    suspended_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    suspension_reason?: StringNullableFilter<"tenants"> | string | null
    payout_config_enc?: StringNullableFilter<"tenants"> | string | null
    created_at?: DateTimeFilter<"tenants"> | Date | string
    updated_at?: DateTimeFilter<"tenants"> | Date | string
    deleted_at?: DateTimeNullableFilter<"tenants"> | Date | string | null
    tenant_modules?: Tenant_modulesListRelationFilter
    central_user_index?: Central_user_indexListRelationFilter
    tenant_branch_links?: Tenant_branch_linksListRelationFilter
    tenant_pricing_configs?: XOR<Tenant_pricing_configsNullableScalarRelationFilter, tenant_pricing_configsWhereInput> | null
    invoices?: InvoicesListRelationFilter
  }, "id" | "subdomain" | "custom_domain">

  export type tenantsOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    legal_name?: SortOrderInput | SortOrder
    subdomain?: SortOrder
    custom_domain?: SortOrderInput | SortOrder
    logo_url?: SortOrderInput | SortOrder
    primary_color?: SortOrderInput | SortOrder
    background_color?: SortOrderInput | SortOrder
    background_url?: SortOrderInput | SortOrder
    sitemap_url?: SortOrderInput | SortOrder
    plan?: SortOrder
    plan_expires_at?: SortOrderInput | SortOrder
    max_employees?: SortOrder
    db_mode?: SortOrder
    db_url?: SortOrderInput | SortOrder
    schema_name?: SortOrderInput | SortOrder
    local_db_type?: SortOrderInput | SortOrder
    local_db_host?: SortOrderInput | SortOrder
    local_db_port?: SortOrderInput | SortOrder
    local_db_name?: SortOrderInput | SortOrder
    local_db_user?: SortOrderInput | SortOrder
    local_db_pass?: SortOrderInput | SortOrder
    sync_interval_min?: SortOrderInput | SortOrder
    gstin?: SortOrderInput | SortOrder
    pan?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    gst_status?: SortOrderInput | SortOrder
    gst_reg_date?: SortOrderInput | SortOrder
    taxpayer_type?: SortOrderInput | SortOrder
    constitution?: SortOrderInput | SortOrder
    e_invoice_enabled?: SortOrderInput | SortOrder
    business_nature?: SortOrderInput | SortOrder
    admin_name?: SortOrderInput | SortOrder
    admin_email?: SortOrderInput | SortOrder
    admin_phone?: SortOrderInput | SortOrder
    is_active?: SortOrder
    is_setup_complete?: SortOrder
    suspended_at?: SortOrderInput | SortOrder
    suspension_reason?: SortOrderInput | SortOrder
    payout_config_enc?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    deleted_at?: SortOrderInput | SortOrder
    _count?: tenantsCountOrderByAggregateInput
    _avg?: tenantsAvgOrderByAggregateInput
    _max?: tenantsMaxOrderByAggregateInput
    _min?: tenantsMinOrderByAggregateInput
    _sum?: tenantsSumOrderByAggregateInput
  }

  export type tenantsScalarWhereWithAggregatesInput = {
    AND?: tenantsScalarWhereWithAggregatesInput | tenantsScalarWhereWithAggregatesInput[]
    OR?: tenantsScalarWhereWithAggregatesInput[]
    NOT?: tenantsScalarWhereWithAggregatesInput | tenantsScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"tenants"> | string
    name?: StringWithAggregatesFilter<"tenants"> | string
    legal_name?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    subdomain?: StringWithAggregatesFilter<"tenants"> | string
    custom_domain?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    logo_url?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    primary_color?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    background_color?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    background_url?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    sitemap_url?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    plan?: StringWithAggregatesFilter<"tenants"> | string
    plan_expires_at?: DateTimeNullableWithAggregatesFilter<"tenants"> | Date | string | null
    max_employees?: IntWithAggregatesFilter<"tenants"> | number
    db_mode?: StringWithAggregatesFilter<"tenants"> | string
    db_url?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    schema_name?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    local_db_type?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    local_db_host?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    local_db_port?: IntNullableWithAggregatesFilter<"tenants"> | number | null
    local_db_name?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    local_db_user?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    local_db_pass?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    sync_interval_min?: IntNullableWithAggregatesFilter<"tenants"> | number | null
    gstin?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    pan?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    city?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    state?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    address?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    pincode?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    gst_status?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    gst_reg_date?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    taxpayer_type?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    constitution?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    e_invoice_enabled?: BoolNullableWithAggregatesFilter<"tenants"> | boolean | null
    business_nature?: JsonNullableWithAggregatesFilter<"tenants">
    admin_name?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    admin_email?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    admin_phone?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    is_active?: BoolWithAggregatesFilter<"tenants"> | boolean
    is_setup_complete?: BoolWithAggregatesFilter<"tenants"> | boolean
    suspended_at?: DateTimeNullableWithAggregatesFilter<"tenants"> | Date | string | null
    suspension_reason?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    payout_config_enc?: StringNullableWithAggregatesFilter<"tenants"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"tenants"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"tenants"> | Date | string
    deleted_at?: DateTimeNullableWithAggregatesFilter<"tenants"> | Date | string | null
  }

  export type tenant_modulesWhereInput = {
    AND?: tenant_modulesWhereInput | tenant_modulesWhereInput[]
    OR?: tenant_modulesWhereInput[]
    NOT?: tenant_modulesWhereInput | tenant_modulesWhereInput[]
    id?: UuidFilter<"tenant_modules"> | string
    tenant_id?: UuidFilter<"tenant_modules"> | string
    module_name?: StringFilter<"tenant_modules"> | string
    is_active?: BoolFilter<"tenant_modules"> | boolean
    custom_price_paise?: IntNullableFilter<"tenant_modules"> | number | null
    enabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
    disabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type tenant_modulesOrderByWithRelationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    module_name?: SortOrder
    is_active?: SortOrder
    custom_price_paise?: SortOrderInput | SortOrder
    enabled_at?: SortOrderInput | SortOrder
    disabled_at?: SortOrderInput | SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type tenant_modulesWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    uq_tenant_module?: tenant_modulesUq_tenant_moduleCompoundUniqueInput
    AND?: tenant_modulesWhereInput | tenant_modulesWhereInput[]
    OR?: tenant_modulesWhereInput[]
    NOT?: tenant_modulesWhereInput | tenant_modulesWhereInput[]
    tenant_id?: UuidFilter<"tenant_modules"> | string
    module_name?: StringFilter<"tenant_modules"> | string
    is_active?: BoolFilter<"tenant_modules"> | boolean
    custom_price_paise?: IntNullableFilter<"tenant_modules"> | number | null
    enabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
    disabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id" | "uq_tenant_module">

  export type tenant_modulesOrderByWithAggregationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    module_name?: SortOrder
    is_active?: SortOrder
    custom_price_paise?: SortOrderInput | SortOrder
    enabled_at?: SortOrderInput | SortOrder
    disabled_at?: SortOrderInput | SortOrder
    _count?: tenant_modulesCountOrderByAggregateInput
    _avg?: tenant_modulesAvgOrderByAggregateInput
    _max?: tenant_modulesMaxOrderByAggregateInput
    _min?: tenant_modulesMinOrderByAggregateInput
    _sum?: tenant_modulesSumOrderByAggregateInput
  }

  export type tenant_modulesScalarWhereWithAggregatesInput = {
    AND?: tenant_modulesScalarWhereWithAggregatesInput | tenant_modulesScalarWhereWithAggregatesInput[]
    OR?: tenant_modulesScalarWhereWithAggregatesInput[]
    NOT?: tenant_modulesScalarWhereWithAggregatesInput | tenant_modulesScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"tenant_modules"> | string
    tenant_id?: UuidWithAggregatesFilter<"tenant_modules"> | string
    module_name?: StringWithAggregatesFilter<"tenant_modules"> | string
    is_active?: BoolWithAggregatesFilter<"tenant_modules"> | boolean
    custom_price_paise?: IntNullableWithAggregatesFilter<"tenant_modules"> | number | null
    enabled_at?: DateTimeNullableWithAggregatesFilter<"tenant_modules"> | Date | string | null
    disabled_at?: DateTimeNullableWithAggregatesFilter<"tenant_modules"> | Date | string | null
  }

  export type central_user_indexWhereInput = {
    AND?: central_user_indexWhereInput | central_user_indexWhereInput[]
    OR?: central_user_indexWhereInput[]
    NOT?: central_user_indexWhereInput | central_user_indexWhereInput[]
    id?: UuidFilter<"central_user_index"> | string
    email?: StringFilter<"central_user_index"> | string
    subdomain?: StringFilter<"central_user_index"> | string
    company_id?: UuidFilter<"central_user_index"> | string
    user_id?: UuidNullableFilter<"central_user_index"> | string | null
    is_platform_admin?: BoolFilter<"central_user_index"> | boolean
    is_active?: BoolFilter<"central_user_index"> | boolean
    created_at?: DateTimeFilter<"central_user_index"> | Date | string
    updated_at?: DateTimeFilter<"central_user_index"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type central_user_indexOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    subdomain?: SortOrder
    company_id?: SortOrder
    user_id?: SortOrderInput | SortOrder
    is_platform_admin?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type central_user_indexWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    uq_email_company?: central_user_indexUq_email_companyCompoundUniqueInput
    AND?: central_user_indexWhereInput | central_user_indexWhereInput[]
    OR?: central_user_indexWhereInput[]
    NOT?: central_user_indexWhereInput | central_user_indexWhereInput[]
    email?: StringFilter<"central_user_index"> | string
    subdomain?: StringFilter<"central_user_index"> | string
    company_id?: UuidFilter<"central_user_index"> | string
    user_id?: UuidNullableFilter<"central_user_index"> | string | null
    is_platform_admin?: BoolFilter<"central_user_index"> | boolean
    is_active?: BoolFilter<"central_user_index"> | boolean
    created_at?: DateTimeFilter<"central_user_index"> | Date | string
    updated_at?: DateTimeFilter<"central_user_index"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id" | "uq_email_company">

  export type central_user_indexOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    subdomain?: SortOrder
    company_id?: SortOrder
    user_id?: SortOrderInput | SortOrder
    is_platform_admin?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: central_user_indexCountOrderByAggregateInput
    _max?: central_user_indexMaxOrderByAggregateInput
    _min?: central_user_indexMinOrderByAggregateInput
  }

  export type central_user_indexScalarWhereWithAggregatesInput = {
    AND?: central_user_indexScalarWhereWithAggregatesInput | central_user_indexScalarWhereWithAggregatesInput[]
    OR?: central_user_indexScalarWhereWithAggregatesInput[]
    NOT?: central_user_indexScalarWhereWithAggregatesInput | central_user_indexScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"central_user_index"> | string
    email?: StringWithAggregatesFilter<"central_user_index"> | string
    subdomain?: StringWithAggregatesFilter<"central_user_index"> | string
    company_id?: UuidWithAggregatesFilter<"central_user_index"> | string
    user_id?: UuidNullableWithAggregatesFilter<"central_user_index"> | string | null
    is_platform_admin?: BoolWithAggregatesFilter<"central_user_index"> | boolean
    is_active?: BoolWithAggregatesFilter<"central_user_index"> | boolean
    created_at?: DateTimeWithAggregatesFilter<"central_user_index"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"central_user_index"> | Date | string
  }

  export type tenant_branch_linksWhereInput = {
    AND?: tenant_branch_linksWhereInput | tenant_branch_linksWhereInput[]
    OR?: tenant_branch_linksWhereInput[]
    NOT?: tenant_branch_linksWhereInput | tenant_branch_linksWhereInput[]
    id?: UuidFilter<"tenant_branch_links"> | string
    tenant_id?: UuidFilter<"tenant_branch_links"> | string
    gstin?: StringFilter<"tenant_branch_links"> | string
    pan?: StringFilter<"tenant_branch_links"> | string
    branch_name?: StringNullableFilter<"tenant_branch_links"> | string | null
    branch_no?: StringNullableFilter<"tenant_branch_links"> | string | null
    address?: StringNullableFilter<"tenant_branch_links"> | string | null
    city?: StringNullableFilter<"tenant_branch_links"> | string | null
    state?: StringNullableFilter<"tenant_branch_links"> | string | null
    pincode?: StringNullableFilter<"tenant_branch_links"> | string | null
    status?: StringFilter<"tenant_branch_links"> | string
    requested_at?: DateTimeFilter<"tenant_branch_links"> | Date | string
    approved_at?: DateTimeNullableFilter<"tenant_branch_links"> | Date | string | null
    note?: StringNullableFilter<"tenant_branch_links"> | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type tenant_branch_linksOrderByWithRelationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    branch_name?: SortOrderInput | SortOrder
    branch_no?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    status?: SortOrder
    requested_at?: SortOrder
    approved_at?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type tenant_branch_linksWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    gstin?: string
    AND?: tenant_branch_linksWhereInput | tenant_branch_linksWhereInput[]
    OR?: tenant_branch_linksWhereInput[]
    NOT?: tenant_branch_linksWhereInput | tenant_branch_linksWhereInput[]
    tenant_id?: UuidFilter<"tenant_branch_links"> | string
    pan?: StringFilter<"tenant_branch_links"> | string
    branch_name?: StringNullableFilter<"tenant_branch_links"> | string | null
    branch_no?: StringNullableFilter<"tenant_branch_links"> | string | null
    address?: StringNullableFilter<"tenant_branch_links"> | string | null
    city?: StringNullableFilter<"tenant_branch_links"> | string | null
    state?: StringNullableFilter<"tenant_branch_links"> | string | null
    pincode?: StringNullableFilter<"tenant_branch_links"> | string | null
    status?: StringFilter<"tenant_branch_links"> | string
    requested_at?: DateTimeFilter<"tenant_branch_links"> | Date | string
    approved_at?: DateTimeNullableFilter<"tenant_branch_links"> | Date | string | null
    note?: StringNullableFilter<"tenant_branch_links"> | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id" | "gstin">

  export type tenant_branch_linksOrderByWithAggregationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    branch_name?: SortOrderInput | SortOrder
    branch_no?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    status?: SortOrder
    requested_at?: SortOrder
    approved_at?: SortOrderInput | SortOrder
    note?: SortOrderInput | SortOrder
    _count?: tenant_branch_linksCountOrderByAggregateInput
    _max?: tenant_branch_linksMaxOrderByAggregateInput
    _min?: tenant_branch_linksMinOrderByAggregateInput
  }

  export type tenant_branch_linksScalarWhereWithAggregatesInput = {
    AND?: tenant_branch_linksScalarWhereWithAggregatesInput | tenant_branch_linksScalarWhereWithAggregatesInput[]
    OR?: tenant_branch_linksScalarWhereWithAggregatesInput[]
    NOT?: tenant_branch_linksScalarWhereWithAggregatesInput | tenant_branch_linksScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"tenant_branch_links"> | string
    tenant_id?: UuidWithAggregatesFilter<"tenant_branch_links"> | string
    gstin?: StringWithAggregatesFilter<"tenant_branch_links"> | string
    pan?: StringWithAggregatesFilter<"tenant_branch_links"> | string
    branch_name?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    branch_no?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    address?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    city?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    state?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    pincode?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
    status?: StringWithAggregatesFilter<"tenant_branch_links"> | string
    requested_at?: DateTimeWithAggregatesFilter<"tenant_branch_links"> | Date | string
    approved_at?: DateTimeNullableWithAggregatesFilter<"tenant_branch_links"> | Date | string | null
    note?: StringNullableWithAggregatesFilter<"tenant_branch_links"> | string | null
  }

  export type central_kyc_recordsWhereInput = {
    AND?: central_kyc_recordsWhereInput | central_kyc_recordsWhereInput[]
    OR?: central_kyc_recordsWhereInput[]
    NOT?: central_kyc_recordsWhereInput | central_kyc_recordsWhereInput[]
    id?: UuidFilter<"central_kyc_records"> | string
    aadhaar_hash?: StringFilter<"central_kyc_records"> | string
    method?: StringFilter<"central_kyc_records"> | string
    kyc_timestamp?: DateTimeNullableFilter<"central_kyc_records"> | Date | string | null
    name?: StringNullableFilter<"central_kyc_records"> | string | null
    dob?: StringNullableFilter<"central_kyc_records"> | string | null
    gender?: StringNullableFilter<"central_kyc_records"> | string | null
    careof?: StringNullableFilter<"central_kyc_records"> | string | null
    mobile_encrypted?: StringNullableFilter<"central_kyc_records"> | string | null
    email_encrypted?: StringNullableFilter<"central_kyc_records"> | string | null
    house?: StringNullableFilter<"central_kyc_records"> | string | null
    street?: StringNullableFilter<"central_kyc_records"> | string | null
    loc?: StringNullableFilter<"central_kyc_records"> | string | null
    vtc?: StringNullableFilter<"central_kyc_records"> | string | null
    po?: StringNullableFilter<"central_kyc_records"> | string | null
    subdist?: StringNullableFilter<"central_kyc_records"> | string | null
    dist?: StringNullableFilter<"central_kyc_records"> | string | null
    state?: StringNullableFilter<"central_kyc_records"> | string | null
    country?: StringNullableFilter<"central_kyc_records"> | string | null
    pc?: StringNullableFilter<"central_kyc_records"> | string | null
    pht?: StringNullableFilter<"central_kyc_records"> | string | null
    task_id?: StringNullableFilter<"central_kyc_records"> | string | null
    created_at?: DateTimeFilter<"central_kyc_records"> | Date | string
  }

  export type central_kyc_recordsOrderByWithRelationInput = {
    id?: SortOrder
    aadhaar_hash?: SortOrder
    method?: SortOrder
    kyc_timestamp?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    dob?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    careof?: SortOrderInput | SortOrder
    mobile_encrypted?: SortOrderInput | SortOrder
    email_encrypted?: SortOrderInput | SortOrder
    house?: SortOrderInput | SortOrder
    street?: SortOrderInput | SortOrder
    loc?: SortOrderInput | SortOrder
    vtc?: SortOrderInput | SortOrder
    po?: SortOrderInput | SortOrder
    subdist?: SortOrderInput | SortOrder
    dist?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrderInput | SortOrder
    pc?: SortOrderInput | SortOrder
    pht?: SortOrderInput | SortOrder
    task_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
  }

  export type central_kyc_recordsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    aadhaar_hash?: string
    AND?: central_kyc_recordsWhereInput | central_kyc_recordsWhereInput[]
    OR?: central_kyc_recordsWhereInput[]
    NOT?: central_kyc_recordsWhereInput | central_kyc_recordsWhereInput[]
    method?: StringFilter<"central_kyc_records"> | string
    kyc_timestamp?: DateTimeNullableFilter<"central_kyc_records"> | Date | string | null
    name?: StringNullableFilter<"central_kyc_records"> | string | null
    dob?: StringNullableFilter<"central_kyc_records"> | string | null
    gender?: StringNullableFilter<"central_kyc_records"> | string | null
    careof?: StringNullableFilter<"central_kyc_records"> | string | null
    mobile_encrypted?: StringNullableFilter<"central_kyc_records"> | string | null
    email_encrypted?: StringNullableFilter<"central_kyc_records"> | string | null
    house?: StringNullableFilter<"central_kyc_records"> | string | null
    street?: StringNullableFilter<"central_kyc_records"> | string | null
    loc?: StringNullableFilter<"central_kyc_records"> | string | null
    vtc?: StringNullableFilter<"central_kyc_records"> | string | null
    po?: StringNullableFilter<"central_kyc_records"> | string | null
    subdist?: StringNullableFilter<"central_kyc_records"> | string | null
    dist?: StringNullableFilter<"central_kyc_records"> | string | null
    state?: StringNullableFilter<"central_kyc_records"> | string | null
    country?: StringNullableFilter<"central_kyc_records"> | string | null
    pc?: StringNullableFilter<"central_kyc_records"> | string | null
    pht?: StringNullableFilter<"central_kyc_records"> | string | null
    task_id?: StringNullableFilter<"central_kyc_records"> | string | null
    created_at?: DateTimeFilter<"central_kyc_records"> | Date | string
  }, "id" | "aadhaar_hash">

  export type central_kyc_recordsOrderByWithAggregationInput = {
    id?: SortOrder
    aadhaar_hash?: SortOrder
    method?: SortOrder
    kyc_timestamp?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    dob?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    careof?: SortOrderInput | SortOrder
    mobile_encrypted?: SortOrderInput | SortOrder
    email_encrypted?: SortOrderInput | SortOrder
    house?: SortOrderInput | SortOrder
    street?: SortOrderInput | SortOrder
    loc?: SortOrderInput | SortOrder
    vtc?: SortOrderInput | SortOrder
    po?: SortOrderInput | SortOrder
    subdist?: SortOrderInput | SortOrder
    dist?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrderInput | SortOrder
    pc?: SortOrderInput | SortOrder
    pht?: SortOrderInput | SortOrder
    task_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: central_kyc_recordsCountOrderByAggregateInput
    _max?: central_kyc_recordsMaxOrderByAggregateInput
    _min?: central_kyc_recordsMinOrderByAggregateInput
  }

  export type central_kyc_recordsScalarWhereWithAggregatesInput = {
    AND?: central_kyc_recordsScalarWhereWithAggregatesInput | central_kyc_recordsScalarWhereWithAggregatesInput[]
    OR?: central_kyc_recordsScalarWhereWithAggregatesInput[]
    NOT?: central_kyc_recordsScalarWhereWithAggregatesInput | central_kyc_recordsScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"central_kyc_records"> | string
    aadhaar_hash?: StringWithAggregatesFilter<"central_kyc_records"> | string
    method?: StringWithAggregatesFilter<"central_kyc_records"> | string
    kyc_timestamp?: DateTimeNullableWithAggregatesFilter<"central_kyc_records"> | Date | string | null
    name?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    dob?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    gender?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    careof?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    mobile_encrypted?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    email_encrypted?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    house?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    street?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    loc?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    vtc?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    po?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    subdist?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    dist?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    state?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    country?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    pc?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    pht?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    task_id?: StringNullableWithAggregatesFilter<"central_kyc_records"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"central_kyc_records"> | Date | string
  }

  export type central_gst_recordsWhereInput = {
    AND?: central_gst_recordsWhereInput | central_gst_recordsWhereInput[]
    OR?: central_gst_recordsWhereInput[]
    NOT?: central_gst_recordsWhereInput | central_gst_recordsWhereInput[]
    id?: UuidFilter<"central_gst_records"> | string
    gstin?: StringFilter<"central_gst_records"> | string
    pan?: StringNullableFilter<"central_gst_records"> | string | null
    company_name?: StringNullableFilter<"central_gst_records"> | string | null
    legal_name?: StringNullableFilter<"central_gst_records"> | string | null
    trade_name?: StringNullableFilter<"central_gst_records"> | string | null
    state?: StringNullableFilter<"central_gst_records"> | string | null
    state_code?: StringNullableFilter<"central_gst_records"> | string | null
    gst_status?: StringNullableFilter<"central_gst_records"> | string | null
    gst_reg_date?: StringNullableFilter<"central_gst_records"> | string | null
    taxpayer_type?: StringNullableFilter<"central_gst_records"> | string | null
    constitution?: StringNullableFilter<"central_gst_records"> | string | null
    business_nature?: JsonNullableFilter<"central_gst_records">
    dealing_in?: JsonNullableFilter<"central_gst_records">
    address?: StringNullableFilter<"central_gst_records"> | string | null
    city?: StringNullableFilter<"central_gst_records"> | string | null
    pincode?: StringNullableFilter<"central_gst_records"> | string | null
    location?: StringNullableFilter<"central_gst_records"> | string | null
    district?: StringNullableFilter<"central_gst_records"> | string | null
    branch_no?: StringNullableFilter<"central_gst_records"> | string | null
    branch_name?: StringNullableFilter<"central_gst_records"> | string | null
    flat_no?: StringNullableFilter<"central_gst_records"> | string | null
    street?: StringNullableFilter<"central_gst_records"> | string | null
    centre_jurisdiction?: StringNullableFilter<"central_gst_records"> | string | null
    centre_code?: StringNullableFilter<"central_gst_records"> | string | null
    state_jurisdiction?: StringNullableFilter<"central_gst_records"> | string | null
    cancellation_date?: StringNullableFilter<"central_gst_records"> | string | null
    data_source?: StringNullableFilter<"central_gst_records"> | string | null
    raw?: JsonNullableFilter<"central_gst_records">
    created_at?: DateTimeFilter<"central_gst_records"> | Date | string
  }

  export type central_gst_recordsOrderByWithRelationInput = {
    id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrderInput | SortOrder
    company_name?: SortOrderInput | SortOrder
    legal_name?: SortOrderInput | SortOrder
    trade_name?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    state_code?: SortOrderInput | SortOrder
    gst_status?: SortOrderInput | SortOrder
    gst_reg_date?: SortOrderInput | SortOrder
    taxpayer_type?: SortOrderInput | SortOrder
    constitution?: SortOrderInput | SortOrder
    business_nature?: SortOrderInput | SortOrder
    dealing_in?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    district?: SortOrderInput | SortOrder
    branch_no?: SortOrderInput | SortOrder
    branch_name?: SortOrderInput | SortOrder
    flat_no?: SortOrderInput | SortOrder
    street?: SortOrderInput | SortOrder
    centre_jurisdiction?: SortOrderInput | SortOrder
    centre_code?: SortOrderInput | SortOrder
    state_jurisdiction?: SortOrderInput | SortOrder
    cancellation_date?: SortOrderInput | SortOrder
    data_source?: SortOrderInput | SortOrder
    raw?: SortOrderInput | SortOrder
    created_at?: SortOrder
  }

  export type central_gst_recordsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    gstin?: string
    AND?: central_gst_recordsWhereInput | central_gst_recordsWhereInput[]
    OR?: central_gst_recordsWhereInput[]
    NOT?: central_gst_recordsWhereInput | central_gst_recordsWhereInput[]
    pan?: StringNullableFilter<"central_gst_records"> | string | null
    company_name?: StringNullableFilter<"central_gst_records"> | string | null
    legal_name?: StringNullableFilter<"central_gst_records"> | string | null
    trade_name?: StringNullableFilter<"central_gst_records"> | string | null
    state?: StringNullableFilter<"central_gst_records"> | string | null
    state_code?: StringNullableFilter<"central_gst_records"> | string | null
    gst_status?: StringNullableFilter<"central_gst_records"> | string | null
    gst_reg_date?: StringNullableFilter<"central_gst_records"> | string | null
    taxpayer_type?: StringNullableFilter<"central_gst_records"> | string | null
    constitution?: StringNullableFilter<"central_gst_records"> | string | null
    business_nature?: JsonNullableFilter<"central_gst_records">
    dealing_in?: JsonNullableFilter<"central_gst_records">
    address?: StringNullableFilter<"central_gst_records"> | string | null
    city?: StringNullableFilter<"central_gst_records"> | string | null
    pincode?: StringNullableFilter<"central_gst_records"> | string | null
    location?: StringNullableFilter<"central_gst_records"> | string | null
    district?: StringNullableFilter<"central_gst_records"> | string | null
    branch_no?: StringNullableFilter<"central_gst_records"> | string | null
    branch_name?: StringNullableFilter<"central_gst_records"> | string | null
    flat_no?: StringNullableFilter<"central_gst_records"> | string | null
    street?: StringNullableFilter<"central_gst_records"> | string | null
    centre_jurisdiction?: StringNullableFilter<"central_gst_records"> | string | null
    centre_code?: StringNullableFilter<"central_gst_records"> | string | null
    state_jurisdiction?: StringNullableFilter<"central_gst_records"> | string | null
    cancellation_date?: StringNullableFilter<"central_gst_records"> | string | null
    data_source?: StringNullableFilter<"central_gst_records"> | string | null
    raw?: JsonNullableFilter<"central_gst_records">
    created_at?: DateTimeFilter<"central_gst_records"> | Date | string
  }, "id" | "gstin">

  export type central_gst_recordsOrderByWithAggregationInput = {
    id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrderInput | SortOrder
    company_name?: SortOrderInput | SortOrder
    legal_name?: SortOrderInput | SortOrder
    trade_name?: SortOrderInput | SortOrder
    state?: SortOrderInput | SortOrder
    state_code?: SortOrderInput | SortOrder
    gst_status?: SortOrderInput | SortOrder
    gst_reg_date?: SortOrderInput | SortOrder
    taxpayer_type?: SortOrderInput | SortOrder
    constitution?: SortOrderInput | SortOrder
    business_nature?: SortOrderInput | SortOrder
    dealing_in?: SortOrderInput | SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    pincode?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    district?: SortOrderInput | SortOrder
    branch_no?: SortOrderInput | SortOrder
    branch_name?: SortOrderInput | SortOrder
    flat_no?: SortOrderInput | SortOrder
    street?: SortOrderInput | SortOrder
    centre_jurisdiction?: SortOrderInput | SortOrder
    centre_code?: SortOrderInput | SortOrder
    state_jurisdiction?: SortOrderInput | SortOrder
    cancellation_date?: SortOrderInput | SortOrder
    data_source?: SortOrderInput | SortOrder
    raw?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: central_gst_recordsCountOrderByAggregateInput
    _max?: central_gst_recordsMaxOrderByAggregateInput
    _min?: central_gst_recordsMinOrderByAggregateInput
  }

  export type central_gst_recordsScalarWhereWithAggregatesInput = {
    AND?: central_gst_recordsScalarWhereWithAggregatesInput | central_gst_recordsScalarWhereWithAggregatesInput[]
    OR?: central_gst_recordsScalarWhereWithAggregatesInput[]
    NOT?: central_gst_recordsScalarWhereWithAggregatesInput | central_gst_recordsScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"central_gst_records"> | string
    gstin?: StringWithAggregatesFilter<"central_gst_records"> | string
    pan?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    company_name?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    legal_name?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    trade_name?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    state?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    state_code?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    gst_status?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    gst_reg_date?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    taxpayer_type?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    constitution?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    business_nature?: JsonNullableWithAggregatesFilter<"central_gst_records">
    dealing_in?: JsonNullableWithAggregatesFilter<"central_gst_records">
    address?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    city?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    pincode?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    location?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    district?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    branch_no?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    branch_name?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    flat_no?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    street?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    centre_jurisdiction?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    centre_code?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    state_jurisdiction?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    cancellation_date?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    data_source?: StringNullableWithAggregatesFilter<"central_gst_records"> | string | null
    raw?: JsonNullableWithAggregatesFilter<"central_gst_records">
    created_at?: DateTimeWithAggregatesFilter<"central_gst_records"> | Date | string
  }

  export type platform_settingsWhereInput = {
    AND?: platform_settingsWhereInput | platform_settingsWhereInput[]
    OR?: platform_settingsWhereInput[]
    NOT?: platform_settingsWhereInput | platform_settingsWhereInput[]
    id?: StringFilter<"platform_settings"> | string
    values?: JsonFilter<"platform_settings">
    updated_at?: DateTimeFilter<"platform_settings"> | Date | string
  }

  export type platform_settingsOrderByWithRelationInput = {
    id?: SortOrder
    values?: SortOrder
    updated_at?: SortOrder
  }

  export type platform_settingsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: platform_settingsWhereInput | platform_settingsWhereInput[]
    OR?: platform_settingsWhereInput[]
    NOT?: platform_settingsWhereInput | platform_settingsWhereInput[]
    values?: JsonFilter<"platform_settings">
    updated_at?: DateTimeFilter<"platform_settings"> | Date | string
  }, "id">

  export type platform_settingsOrderByWithAggregationInput = {
    id?: SortOrder
    values?: SortOrder
    updated_at?: SortOrder
    _count?: platform_settingsCountOrderByAggregateInput
    _max?: platform_settingsMaxOrderByAggregateInput
    _min?: platform_settingsMinOrderByAggregateInput
  }

  export type platform_settingsScalarWhereWithAggregatesInput = {
    AND?: platform_settingsScalarWhereWithAggregatesInput | platform_settingsScalarWhereWithAggregatesInput[]
    OR?: platform_settingsScalarWhereWithAggregatesInput[]
    NOT?: platform_settingsScalarWhereWithAggregatesInput | platform_settingsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"platform_settings"> | string
    values?: JsonWithAggregatesFilter<"platform_settings">
    updated_at?: DateTimeWithAggregatesFilter<"platform_settings"> | Date | string
  }

  export type tenant_pricing_configsWhereInput = {
    AND?: tenant_pricing_configsWhereInput | tenant_pricing_configsWhereInput[]
    OR?: tenant_pricing_configsWhereInput[]
    NOT?: tenant_pricing_configsWhereInput | tenant_pricing_configsWhereInput[]
    id?: UuidFilter<"tenant_pricing_configs"> | string
    tenant_id?: UuidFilter<"tenant_pricing_configs"> | string
    base_price_paise?: IntFilter<"tenant_pricing_configs"> | number
    employee_cap?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    per_employee_excess_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    discount_base_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: JsonNullableFilter<"tenant_pricing_configs">
    discount_bundle_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    discount_tenure_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    tenure_months?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    offer_flat_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    offer_expiry_date?: DateTimeNullableFilter<"tenant_pricing_configs"> | Date | string | null
    is_stackable?: BoolNullableFilter<"tenant_pricing_configs"> | boolean | null
    final_override_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    billing_cycle?: StringNullableFilter<"tenant_pricing_configs"> | string | null
    updated_at?: DateTimeNullableFilter<"tenant_pricing_configs"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type tenant_pricing_configsOrderByWithRelationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    base_price_paise?: SortOrder
    employee_cap?: SortOrderInput | SortOrder
    per_employee_excess_paise?: SortOrderInput | SortOrder
    discount_base_pct?: SortOrderInput | SortOrder
    discount_module_pct?: SortOrderInput | SortOrder
    discount_bundle_pct?: SortOrderInput | SortOrder
    bundle_trigger_count?: SortOrderInput | SortOrder
    discount_tenure_pct?: SortOrderInput | SortOrder
    tenure_months?: SortOrderInput | SortOrder
    offer_flat_paise?: SortOrderInput | SortOrder
    offer_expiry_date?: SortOrderInput | SortOrder
    is_stackable?: SortOrderInput | SortOrder
    final_override_paise?: SortOrderInput | SortOrder
    billing_cycle?: SortOrderInput | SortOrder
    updated_at?: SortOrderInput | SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type tenant_pricing_configsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    tenant_id?: string
    AND?: tenant_pricing_configsWhereInput | tenant_pricing_configsWhereInput[]
    OR?: tenant_pricing_configsWhereInput[]
    NOT?: tenant_pricing_configsWhereInput | tenant_pricing_configsWhereInput[]
    base_price_paise?: IntFilter<"tenant_pricing_configs"> | number
    employee_cap?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    per_employee_excess_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    discount_base_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: JsonNullableFilter<"tenant_pricing_configs">
    discount_bundle_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    discount_tenure_pct?: DecimalNullableFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    tenure_months?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    offer_flat_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    offer_expiry_date?: DateTimeNullableFilter<"tenant_pricing_configs"> | Date | string | null
    is_stackable?: BoolNullableFilter<"tenant_pricing_configs"> | boolean | null
    final_override_paise?: IntNullableFilter<"tenant_pricing_configs"> | number | null
    billing_cycle?: StringNullableFilter<"tenant_pricing_configs"> | string | null
    updated_at?: DateTimeNullableFilter<"tenant_pricing_configs"> | Date | string | null
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id" | "tenant_id">

  export type tenant_pricing_configsOrderByWithAggregationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    base_price_paise?: SortOrder
    employee_cap?: SortOrderInput | SortOrder
    per_employee_excess_paise?: SortOrderInput | SortOrder
    discount_base_pct?: SortOrderInput | SortOrder
    discount_module_pct?: SortOrderInput | SortOrder
    discount_bundle_pct?: SortOrderInput | SortOrder
    bundle_trigger_count?: SortOrderInput | SortOrder
    discount_tenure_pct?: SortOrderInput | SortOrder
    tenure_months?: SortOrderInput | SortOrder
    offer_flat_paise?: SortOrderInput | SortOrder
    offer_expiry_date?: SortOrderInput | SortOrder
    is_stackable?: SortOrderInput | SortOrder
    final_override_paise?: SortOrderInput | SortOrder
    billing_cycle?: SortOrderInput | SortOrder
    updated_at?: SortOrderInput | SortOrder
    _count?: tenant_pricing_configsCountOrderByAggregateInput
    _avg?: tenant_pricing_configsAvgOrderByAggregateInput
    _max?: tenant_pricing_configsMaxOrderByAggregateInput
    _min?: tenant_pricing_configsMinOrderByAggregateInput
    _sum?: tenant_pricing_configsSumOrderByAggregateInput
  }

  export type tenant_pricing_configsScalarWhereWithAggregatesInput = {
    AND?: tenant_pricing_configsScalarWhereWithAggregatesInput | tenant_pricing_configsScalarWhereWithAggregatesInput[]
    OR?: tenant_pricing_configsScalarWhereWithAggregatesInput[]
    NOT?: tenant_pricing_configsScalarWhereWithAggregatesInput | tenant_pricing_configsScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"tenant_pricing_configs"> | string
    tenant_id?: UuidWithAggregatesFilter<"tenant_pricing_configs"> | string
    base_price_paise?: IntWithAggregatesFilter<"tenant_pricing_configs"> | number
    employee_cap?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    per_employee_excess_paise?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    discount_base_pct?: DecimalNullableWithAggregatesFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: JsonNullableWithAggregatesFilter<"tenant_pricing_configs">
    discount_bundle_pct?: DecimalNullableWithAggregatesFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    discount_tenure_pct?: DecimalNullableWithAggregatesFilter<"tenant_pricing_configs"> | Decimal | DecimalJsLike | number | string | null
    tenure_months?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    offer_flat_paise?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    offer_expiry_date?: DateTimeNullableWithAggregatesFilter<"tenant_pricing_configs"> | Date | string | null
    is_stackable?: BoolNullableWithAggregatesFilter<"tenant_pricing_configs"> | boolean | null
    final_override_paise?: IntNullableWithAggregatesFilter<"tenant_pricing_configs"> | number | null
    billing_cycle?: StringNullableWithAggregatesFilter<"tenant_pricing_configs"> | string | null
    updated_at?: DateTimeNullableWithAggregatesFilter<"tenant_pricing_configs"> | Date | string | null
  }

  export type invoicesWhereInput = {
    AND?: invoicesWhereInput | invoicesWhereInput[]
    OR?: invoicesWhereInput[]
    NOT?: invoicesWhereInput | invoicesWhereInput[]
    id?: UuidFilter<"invoices"> | string
    tenant_id?: UuidFilter<"invoices"> | string
    invoice_no?: StringFilter<"invoices"> | string
    period_start?: DateTimeFilter<"invoices"> | Date | string
    period_end?: DateTimeFilter<"invoices"> | Date | string
    issue_date?: DateTimeFilter<"invoices"> | Date | string
    due_date?: DateTimeFilter<"invoices"> | Date | string
    base_amount_paise?: IntFilter<"invoices"> | number
    module_amount_paise?: IntFilter<"invoices"> | number
    excess_amount_paise?: IntFilter<"invoices"> | number
    discount_amount_paise?: IntFilter<"invoices"> | number
    tax_amount_paise?: IntFilter<"invoices"> | number
    total_paise?: IntFilter<"invoices"> | number
    currency?: StringFilter<"invoices"> | string
    status?: StringFilter<"invoices"> | string
    breakdown?: JsonNullableFilter<"invoices">
    pdf_url?: StringNullableFilter<"invoices"> | string | null
    payment_id?: StringNullableFilter<"invoices"> | string | null
    created_at?: DateTimeFilter<"invoices"> | Date | string
    updated_at?: DateTimeFilter<"invoices"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }

  export type invoicesOrderByWithRelationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    invoice_no?: SortOrder
    period_start?: SortOrder
    period_end?: SortOrder
    issue_date?: SortOrder
    due_date?: SortOrder
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    breakdown?: SortOrderInput | SortOrder
    pdf_url?: SortOrderInput | SortOrder
    payment_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    tenant?: tenantsOrderByWithRelationInput
  }

  export type invoicesWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    invoice_no?: string
    AND?: invoicesWhereInput | invoicesWhereInput[]
    OR?: invoicesWhereInput[]
    NOT?: invoicesWhereInput | invoicesWhereInput[]
    tenant_id?: UuidFilter<"invoices"> | string
    period_start?: DateTimeFilter<"invoices"> | Date | string
    period_end?: DateTimeFilter<"invoices"> | Date | string
    issue_date?: DateTimeFilter<"invoices"> | Date | string
    due_date?: DateTimeFilter<"invoices"> | Date | string
    base_amount_paise?: IntFilter<"invoices"> | number
    module_amount_paise?: IntFilter<"invoices"> | number
    excess_amount_paise?: IntFilter<"invoices"> | number
    discount_amount_paise?: IntFilter<"invoices"> | number
    tax_amount_paise?: IntFilter<"invoices"> | number
    total_paise?: IntFilter<"invoices"> | number
    currency?: StringFilter<"invoices"> | string
    status?: StringFilter<"invoices"> | string
    breakdown?: JsonNullableFilter<"invoices">
    pdf_url?: StringNullableFilter<"invoices"> | string | null
    payment_id?: StringNullableFilter<"invoices"> | string | null
    created_at?: DateTimeFilter<"invoices"> | Date | string
    updated_at?: DateTimeFilter<"invoices"> | Date | string
    tenant?: XOR<TenantsScalarRelationFilter, tenantsWhereInput>
  }, "id" | "invoice_no">

  export type invoicesOrderByWithAggregationInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    invoice_no?: SortOrder
    period_start?: SortOrder
    period_end?: SortOrder
    issue_date?: SortOrder
    due_date?: SortOrder
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    breakdown?: SortOrderInput | SortOrder
    pdf_url?: SortOrderInput | SortOrder
    payment_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    _count?: invoicesCountOrderByAggregateInput
    _avg?: invoicesAvgOrderByAggregateInput
    _max?: invoicesMaxOrderByAggregateInput
    _min?: invoicesMinOrderByAggregateInput
    _sum?: invoicesSumOrderByAggregateInput
  }

  export type invoicesScalarWhereWithAggregatesInput = {
    AND?: invoicesScalarWhereWithAggregatesInput | invoicesScalarWhereWithAggregatesInput[]
    OR?: invoicesScalarWhereWithAggregatesInput[]
    NOT?: invoicesScalarWhereWithAggregatesInput | invoicesScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"invoices"> | string
    tenant_id?: UuidWithAggregatesFilter<"invoices"> | string
    invoice_no?: StringWithAggregatesFilter<"invoices"> | string
    period_start?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
    period_end?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
    issue_date?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
    due_date?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
    base_amount_paise?: IntWithAggregatesFilter<"invoices"> | number
    module_amount_paise?: IntWithAggregatesFilter<"invoices"> | number
    excess_amount_paise?: IntWithAggregatesFilter<"invoices"> | number
    discount_amount_paise?: IntWithAggregatesFilter<"invoices"> | number
    tax_amount_paise?: IntWithAggregatesFilter<"invoices"> | number
    total_paise?: IntWithAggregatesFilter<"invoices"> | number
    currency?: StringWithAggregatesFilter<"invoices"> | string
    status?: StringWithAggregatesFilter<"invoices"> | string
    breakdown?: JsonNullableWithAggregatesFilter<"invoices">
    pdf_url?: StringNullableWithAggregatesFilter<"invoices"> | string | null
    payment_id?: StringNullableWithAggregatesFilter<"invoices"> | string | null
    created_at?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
    updated_at?: DateTimeWithAggregatesFilter<"invoices"> | Date | string
  }

  export type tenantsCreateInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsCreateNestedOneWithoutTenantInput
    invoices?: invoicesCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesUncheckedCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexUncheckedCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput
    invoices?: invoicesUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUncheckedUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateManyInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
  }

  export type tenantsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenantsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_modulesCreateInput = {
    id?: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
    tenant: tenantsCreateNestedOneWithoutTenant_modulesInput
  }

  export type tenant_modulesUncheckedCreateInput = {
    id?: string
    tenant_id: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
  }

  export type tenant_modulesUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant?: tenantsUpdateOneRequiredWithoutTenant_modulesNestedInput
  }

  export type tenant_modulesUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_modulesCreateManyInput = {
    id?: string
    tenant_id: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
  }

  export type tenant_modulesUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_modulesUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type central_user_indexCreateInput = {
    id?: string
    email: string
    subdomain: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
    tenant: tenantsCreateNestedOneWithoutCentral_user_indexInput
  }

  export type central_user_indexUncheckedCreateInput = {
    id?: string
    email: string
    subdomain: string
    company_id: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type central_user_indexUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: tenantsUpdateOneRequiredWithoutCentral_user_indexNestedInput
  }

  export type central_user_indexUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_user_indexCreateManyInput = {
    id?: string
    email: string
    subdomain: string
    company_id: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type central_user_indexUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_user_indexUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    company_id?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_branch_linksCreateInput = {
    id?: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
    tenant: tenantsCreateNestedOneWithoutTenant_branch_linksInput
  }

  export type tenant_branch_linksUncheckedCreateInput = {
    id?: string
    tenant_id: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
  }

  export type tenant_branch_linksUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
    tenant?: tenantsUpdateOneRequiredWithoutTenant_branch_linksNestedInput
  }

  export type tenant_branch_linksUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type tenant_branch_linksCreateManyInput = {
    id?: string
    tenant_id: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
  }

  export type tenant_branch_linksUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type tenant_branch_linksUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type central_kyc_recordsCreateInput = {
    id?: string
    aadhaar_hash: string
    method: string
    kyc_timestamp?: Date | string | null
    name?: string | null
    dob?: string | null
    gender?: string | null
    careof?: string | null
    mobile_encrypted?: string | null
    email_encrypted?: string | null
    house?: string | null
    street?: string | null
    loc?: string | null
    vtc?: string | null
    po?: string | null
    subdist?: string | null
    dist?: string | null
    state?: string | null
    country?: string | null
    pc?: string | null
    pht?: string | null
    task_id?: string | null
    created_at?: Date | string
  }

  export type central_kyc_recordsUncheckedCreateInput = {
    id?: string
    aadhaar_hash: string
    method: string
    kyc_timestamp?: Date | string | null
    name?: string | null
    dob?: string | null
    gender?: string | null
    careof?: string | null
    mobile_encrypted?: string | null
    email_encrypted?: string | null
    house?: string | null
    street?: string | null
    loc?: string | null
    vtc?: string | null
    po?: string | null
    subdist?: string | null
    dist?: string | null
    state?: string | null
    country?: string | null
    pc?: string | null
    pht?: string | null
    task_id?: string | null
    created_at?: Date | string
  }

  export type central_kyc_recordsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    aadhaar_hash?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    kyc_timestamp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    careof?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    email_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    house?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    loc?: NullableStringFieldUpdateOperationsInput | string | null
    vtc?: NullableStringFieldUpdateOperationsInput | string | null
    po?: NullableStringFieldUpdateOperationsInput | string | null
    subdist?: NullableStringFieldUpdateOperationsInput | string | null
    dist?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    pc?: NullableStringFieldUpdateOperationsInput | string | null
    pht?: NullableStringFieldUpdateOperationsInput | string | null
    task_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_kyc_recordsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    aadhaar_hash?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    kyc_timestamp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    careof?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    email_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    house?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    loc?: NullableStringFieldUpdateOperationsInput | string | null
    vtc?: NullableStringFieldUpdateOperationsInput | string | null
    po?: NullableStringFieldUpdateOperationsInput | string | null
    subdist?: NullableStringFieldUpdateOperationsInput | string | null
    dist?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    pc?: NullableStringFieldUpdateOperationsInput | string | null
    pht?: NullableStringFieldUpdateOperationsInput | string | null
    task_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_kyc_recordsCreateManyInput = {
    id?: string
    aadhaar_hash: string
    method: string
    kyc_timestamp?: Date | string | null
    name?: string | null
    dob?: string | null
    gender?: string | null
    careof?: string | null
    mobile_encrypted?: string | null
    email_encrypted?: string | null
    house?: string | null
    street?: string | null
    loc?: string | null
    vtc?: string | null
    po?: string | null
    subdist?: string | null
    dist?: string | null
    state?: string | null
    country?: string | null
    pc?: string | null
    pht?: string | null
    task_id?: string | null
    created_at?: Date | string
  }

  export type central_kyc_recordsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    aadhaar_hash?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    kyc_timestamp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    careof?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    email_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    house?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    loc?: NullableStringFieldUpdateOperationsInput | string | null
    vtc?: NullableStringFieldUpdateOperationsInput | string | null
    po?: NullableStringFieldUpdateOperationsInput | string | null
    subdist?: NullableStringFieldUpdateOperationsInput | string | null
    dist?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    pc?: NullableStringFieldUpdateOperationsInput | string | null
    pht?: NullableStringFieldUpdateOperationsInput | string | null
    task_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_kyc_recordsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    aadhaar_hash?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    kyc_timestamp?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    careof?: NullableStringFieldUpdateOperationsInput | string | null
    mobile_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    email_encrypted?: NullableStringFieldUpdateOperationsInput | string | null
    house?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    loc?: NullableStringFieldUpdateOperationsInput | string | null
    vtc?: NullableStringFieldUpdateOperationsInput | string | null
    po?: NullableStringFieldUpdateOperationsInput | string | null
    subdist?: NullableStringFieldUpdateOperationsInput | string | null
    dist?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    pc?: NullableStringFieldUpdateOperationsInput | string | null
    pht?: NullableStringFieldUpdateOperationsInput | string | null
    task_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_gst_recordsCreateInput = {
    id?: string
    gstin: string
    pan?: string | null
    company_name?: string | null
    legal_name?: string | null
    trade_name?: string | null
    state?: string | null
    state_code?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: string | null
    city?: string | null
    pincode?: string | null
    location?: string | null
    district?: string | null
    branch_no?: string | null
    branch_name?: string | null
    flat_no?: string | null
    street?: string | null
    centre_jurisdiction?: string | null
    centre_code?: string | null
    state_jurisdiction?: string | null
    cancellation_date?: string | null
    data_source?: string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type central_gst_recordsUncheckedCreateInput = {
    id?: string
    gstin: string
    pan?: string | null
    company_name?: string | null
    legal_name?: string | null
    trade_name?: string | null
    state?: string | null
    state_code?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: string | null
    city?: string | null
    pincode?: string | null
    location?: string | null
    district?: string | null
    branch_no?: string | null
    branch_name?: string | null
    flat_no?: string | null
    street?: string | null
    centre_jurisdiction?: string | null
    centre_code?: string | null
    state_jurisdiction?: string | null
    cancellation_date?: string | null
    data_source?: string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type central_gst_recordsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    company_name?: NullableStringFieldUpdateOperationsInput | string | null
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    trade_name?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    state_code?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    flat_no?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    centre_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    centre_code?: NullableStringFieldUpdateOperationsInput | string | null
    state_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    cancellation_date?: NullableStringFieldUpdateOperationsInput | string | null
    data_source?: NullableStringFieldUpdateOperationsInput | string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_gst_recordsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    company_name?: NullableStringFieldUpdateOperationsInput | string | null
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    trade_name?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    state_code?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    flat_no?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    centre_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    centre_code?: NullableStringFieldUpdateOperationsInput | string | null
    state_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    cancellation_date?: NullableStringFieldUpdateOperationsInput | string | null
    data_source?: NullableStringFieldUpdateOperationsInput | string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_gst_recordsCreateManyInput = {
    id?: string
    gstin: string
    pan?: string | null
    company_name?: string | null
    legal_name?: string | null
    trade_name?: string | null
    state?: string | null
    state_code?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: string | null
    city?: string | null
    pincode?: string | null
    location?: string | null
    district?: string | null
    branch_no?: string | null
    branch_name?: string | null
    flat_no?: string | null
    street?: string | null
    centre_jurisdiction?: string | null
    centre_code?: string | null
    state_jurisdiction?: string | null
    cancellation_date?: string | null
    data_source?: string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: Date | string
  }

  export type central_gst_recordsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    company_name?: NullableStringFieldUpdateOperationsInput | string | null
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    trade_name?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    state_code?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    flat_no?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    centre_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    centre_code?: NullableStringFieldUpdateOperationsInput | string | null
    state_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    cancellation_date?: NullableStringFieldUpdateOperationsInput | string | null
    data_source?: NullableStringFieldUpdateOperationsInput | string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_gst_recordsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    company_name?: NullableStringFieldUpdateOperationsInput | string | null
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    trade_name?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    state_code?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    dealing_in?: NullableJsonNullValueInput | InputJsonValue
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    district?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    flat_no?: NullableStringFieldUpdateOperationsInput | string | null
    street?: NullableStringFieldUpdateOperationsInput | string | null
    centre_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    centre_code?: NullableStringFieldUpdateOperationsInput | string | null
    state_jurisdiction?: NullableStringFieldUpdateOperationsInput | string | null
    cancellation_date?: NullableStringFieldUpdateOperationsInput | string | null
    data_source?: NullableStringFieldUpdateOperationsInput | string | null
    raw?: NullableJsonNullValueInput | InputJsonValue
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type platform_settingsCreateInput = {
    id: string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: Date | string
  }

  export type platform_settingsUncheckedCreateInput = {
    id: string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: Date | string
  }

  export type platform_settingsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type platform_settingsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type platform_settingsCreateManyInput = {
    id: string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: Date | string
  }

  export type platform_settingsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type platform_settingsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    values?: JsonNullValueInput | InputJsonValue
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_pricing_configsCreateInput = {
    id?: string
    base_price_paise?: number
    employee_cap?: number | null
    per_employee_excess_paise?: number | null
    discount_base_pct?: Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: number | null
    discount_tenure_pct?: Decimal | DecimalJsLike | number | string | null
    tenure_months?: number | null
    offer_flat_paise?: number | null
    offer_expiry_date?: Date | string | null
    is_stackable?: boolean | null
    final_override_paise?: number | null
    billing_cycle?: string | null
    updated_at?: Date | string | null
    tenant: tenantsCreateNestedOneWithoutTenant_pricing_configsInput
  }

  export type tenant_pricing_configsUncheckedCreateInput = {
    id?: string
    tenant_id: string
    base_price_paise?: number
    employee_cap?: number | null
    per_employee_excess_paise?: number | null
    discount_base_pct?: Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: number | null
    discount_tenure_pct?: Decimal | DecimalJsLike | number | string | null
    tenure_months?: number | null
    offer_flat_paise?: number | null
    offer_expiry_date?: Date | string | null
    is_stackable?: boolean | null
    final_override_paise?: number | null
    billing_cycle?: string | null
    updated_at?: Date | string | null
  }

  export type tenant_pricing_configsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant?: tenantsUpdateOneRequiredWithoutTenant_pricing_configsNestedInput
  }

  export type tenant_pricing_configsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_pricing_configsCreateManyInput = {
    id?: string
    tenant_id: string
    base_price_paise?: number
    employee_cap?: number | null
    per_employee_excess_paise?: number | null
    discount_base_pct?: Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: number | null
    discount_tenure_pct?: Decimal | DecimalJsLike | number | string | null
    tenure_months?: number | null
    offer_flat_paise?: number | null
    offer_expiry_date?: Date | string | null
    is_stackable?: boolean | null
    final_override_paise?: number | null
    billing_cycle?: string | null
    updated_at?: Date | string | null
  }

  export type tenant_pricing_configsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_pricing_configsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type invoicesCreateInput = {
    id?: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    tenant: tenantsCreateNestedOneWithoutInvoicesInput
  }

  export type invoicesUncheckedCreateInput = {
    id?: string
    tenant_id: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type invoicesUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    tenant?: tenantsUpdateOneRequiredWithoutInvoicesNestedInput
  }

  export type invoicesUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type invoicesCreateManyInput = {
    id?: string
    tenant_id: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type invoicesUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type invoicesUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    tenant_id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type Tenant_modulesListRelationFilter = {
    every?: tenant_modulesWhereInput
    some?: tenant_modulesWhereInput
    none?: tenant_modulesWhereInput
  }

  export type Central_user_indexListRelationFilter = {
    every?: central_user_indexWhereInput
    some?: central_user_indexWhereInput
    none?: central_user_indexWhereInput
  }

  export type Tenant_branch_linksListRelationFilter = {
    every?: tenant_branch_linksWhereInput
    some?: tenant_branch_linksWhereInput
    none?: tenant_branch_linksWhereInput
  }

  export type Tenant_pricing_configsNullableScalarRelationFilter = {
    is?: tenant_pricing_configsWhereInput | null
    isNot?: tenant_pricing_configsWhereInput | null
  }

  export type InvoicesListRelationFilter = {
    every?: invoicesWhereInput
    some?: invoicesWhereInput
    none?: invoicesWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type tenant_modulesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type central_user_indexOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type tenant_branch_linksOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type invoicesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type tenantsCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    legal_name?: SortOrder
    subdomain?: SortOrder
    custom_domain?: SortOrder
    logo_url?: SortOrder
    primary_color?: SortOrder
    background_color?: SortOrder
    background_url?: SortOrder
    sitemap_url?: SortOrder
    plan?: SortOrder
    plan_expires_at?: SortOrder
    max_employees?: SortOrder
    db_mode?: SortOrder
    db_url?: SortOrder
    schema_name?: SortOrder
    local_db_type?: SortOrder
    local_db_host?: SortOrder
    local_db_port?: SortOrder
    local_db_name?: SortOrder
    local_db_user?: SortOrder
    local_db_pass?: SortOrder
    sync_interval_min?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    city?: SortOrder
    state?: SortOrder
    address?: SortOrder
    pincode?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    e_invoice_enabled?: SortOrder
    business_nature?: SortOrder
    admin_name?: SortOrder
    admin_email?: SortOrder
    admin_phone?: SortOrder
    is_active?: SortOrder
    is_setup_complete?: SortOrder
    suspended_at?: SortOrder
    suspension_reason?: SortOrder
    payout_config_enc?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    deleted_at?: SortOrder
  }

  export type tenantsAvgOrderByAggregateInput = {
    max_employees?: SortOrder
    local_db_port?: SortOrder
    sync_interval_min?: SortOrder
  }

  export type tenantsMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    legal_name?: SortOrder
    subdomain?: SortOrder
    custom_domain?: SortOrder
    logo_url?: SortOrder
    primary_color?: SortOrder
    background_color?: SortOrder
    background_url?: SortOrder
    sitemap_url?: SortOrder
    plan?: SortOrder
    plan_expires_at?: SortOrder
    max_employees?: SortOrder
    db_mode?: SortOrder
    db_url?: SortOrder
    schema_name?: SortOrder
    local_db_type?: SortOrder
    local_db_host?: SortOrder
    local_db_port?: SortOrder
    local_db_name?: SortOrder
    local_db_user?: SortOrder
    local_db_pass?: SortOrder
    sync_interval_min?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    city?: SortOrder
    state?: SortOrder
    address?: SortOrder
    pincode?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    e_invoice_enabled?: SortOrder
    admin_name?: SortOrder
    admin_email?: SortOrder
    admin_phone?: SortOrder
    is_active?: SortOrder
    is_setup_complete?: SortOrder
    suspended_at?: SortOrder
    suspension_reason?: SortOrder
    payout_config_enc?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    deleted_at?: SortOrder
  }

  export type tenantsMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    legal_name?: SortOrder
    subdomain?: SortOrder
    custom_domain?: SortOrder
    logo_url?: SortOrder
    primary_color?: SortOrder
    background_color?: SortOrder
    background_url?: SortOrder
    sitemap_url?: SortOrder
    plan?: SortOrder
    plan_expires_at?: SortOrder
    max_employees?: SortOrder
    db_mode?: SortOrder
    db_url?: SortOrder
    schema_name?: SortOrder
    local_db_type?: SortOrder
    local_db_host?: SortOrder
    local_db_port?: SortOrder
    local_db_name?: SortOrder
    local_db_user?: SortOrder
    local_db_pass?: SortOrder
    sync_interval_min?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    city?: SortOrder
    state?: SortOrder
    address?: SortOrder
    pincode?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    e_invoice_enabled?: SortOrder
    admin_name?: SortOrder
    admin_email?: SortOrder
    admin_phone?: SortOrder
    is_active?: SortOrder
    is_setup_complete?: SortOrder
    suspended_at?: SortOrder
    suspension_reason?: SortOrder
    payout_config_enc?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
    deleted_at?: SortOrder
  }

  export type tenantsSumOrderByAggregateInput = {
    max_employees?: SortOrder
    local_db_port?: SortOrder
    sync_interval_min?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type TenantsScalarRelationFilter = {
    is?: tenantsWhereInput
    isNot?: tenantsWhereInput
  }

  export type tenant_modulesUq_tenant_moduleCompoundUniqueInput = {
    tenant_id: string
    module_name: string
  }

  export type tenant_modulesCountOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    module_name?: SortOrder
    is_active?: SortOrder
    custom_price_paise?: SortOrder
    enabled_at?: SortOrder
    disabled_at?: SortOrder
  }

  export type tenant_modulesAvgOrderByAggregateInput = {
    custom_price_paise?: SortOrder
  }

  export type tenant_modulesMaxOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    module_name?: SortOrder
    is_active?: SortOrder
    custom_price_paise?: SortOrder
    enabled_at?: SortOrder
    disabled_at?: SortOrder
  }

  export type tenant_modulesMinOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    module_name?: SortOrder
    is_active?: SortOrder
    custom_price_paise?: SortOrder
    enabled_at?: SortOrder
    disabled_at?: SortOrder
  }

  export type tenant_modulesSumOrderByAggregateInput = {
    custom_price_paise?: SortOrder
  }

  export type UuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type central_user_indexUq_email_companyCompoundUniqueInput = {
    email: string
    company_id: string
  }

  export type central_user_indexCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    subdomain?: SortOrder
    company_id?: SortOrder
    user_id?: SortOrder
    is_platform_admin?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type central_user_indexMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    subdomain?: SortOrder
    company_id?: SortOrder
    user_id?: SortOrder
    is_platform_admin?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type central_user_indexMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    subdomain?: SortOrder
    company_id?: SortOrder
    user_id?: SortOrder
    is_platform_admin?: SortOrder
    is_active?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type UuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type tenant_branch_linksCountOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    branch_name?: SortOrder
    branch_no?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    status?: SortOrder
    requested_at?: SortOrder
    approved_at?: SortOrder
    note?: SortOrder
  }

  export type tenant_branch_linksMaxOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    branch_name?: SortOrder
    branch_no?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    status?: SortOrder
    requested_at?: SortOrder
    approved_at?: SortOrder
    note?: SortOrder
  }

  export type tenant_branch_linksMinOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    branch_name?: SortOrder
    branch_no?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    pincode?: SortOrder
    status?: SortOrder
    requested_at?: SortOrder
    approved_at?: SortOrder
    note?: SortOrder
  }

  export type central_kyc_recordsCountOrderByAggregateInput = {
    id?: SortOrder
    aadhaar_hash?: SortOrder
    method?: SortOrder
    kyc_timestamp?: SortOrder
    name?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    careof?: SortOrder
    mobile_encrypted?: SortOrder
    email_encrypted?: SortOrder
    house?: SortOrder
    street?: SortOrder
    loc?: SortOrder
    vtc?: SortOrder
    po?: SortOrder
    subdist?: SortOrder
    dist?: SortOrder
    state?: SortOrder
    country?: SortOrder
    pc?: SortOrder
    pht?: SortOrder
    task_id?: SortOrder
    created_at?: SortOrder
  }

  export type central_kyc_recordsMaxOrderByAggregateInput = {
    id?: SortOrder
    aadhaar_hash?: SortOrder
    method?: SortOrder
    kyc_timestamp?: SortOrder
    name?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    careof?: SortOrder
    mobile_encrypted?: SortOrder
    email_encrypted?: SortOrder
    house?: SortOrder
    street?: SortOrder
    loc?: SortOrder
    vtc?: SortOrder
    po?: SortOrder
    subdist?: SortOrder
    dist?: SortOrder
    state?: SortOrder
    country?: SortOrder
    pc?: SortOrder
    pht?: SortOrder
    task_id?: SortOrder
    created_at?: SortOrder
  }

  export type central_kyc_recordsMinOrderByAggregateInput = {
    id?: SortOrder
    aadhaar_hash?: SortOrder
    method?: SortOrder
    kyc_timestamp?: SortOrder
    name?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    careof?: SortOrder
    mobile_encrypted?: SortOrder
    email_encrypted?: SortOrder
    house?: SortOrder
    street?: SortOrder
    loc?: SortOrder
    vtc?: SortOrder
    po?: SortOrder
    subdist?: SortOrder
    dist?: SortOrder
    state?: SortOrder
    country?: SortOrder
    pc?: SortOrder
    pht?: SortOrder
    task_id?: SortOrder
    created_at?: SortOrder
  }

  export type central_gst_recordsCountOrderByAggregateInput = {
    id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    company_name?: SortOrder
    legal_name?: SortOrder
    trade_name?: SortOrder
    state?: SortOrder
    state_code?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    business_nature?: SortOrder
    dealing_in?: SortOrder
    address?: SortOrder
    city?: SortOrder
    pincode?: SortOrder
    location?: SortOrder
    district?: SortOrder
    branch_no?: SortOrder
    branch_name?: SortOrder
    flat_no?: SortOrder
    street?: SortOrder
    centre_jurisdiction?: SortOrder
    centre_code?: SortOrder
    state_jurisdiction?: SortOrder
    cancellation_date?: SortOrder
    data_source?: SortOrder
    raw?: SortOrder
    created_at?: SortOrder
  }

  export type central_gst_recordsMaxOrderByAggregateInput = {
    id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    company_name?: SortOrder
    legal_name?: SortOrder
    trade_name?: SortOrder
    state?: SortOrder
    state_code?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    address?: SortOrder
    city?: SortOrder
    pincode?: SortOrder
    location?: SortOrder
    district?: SortOrder
    branch_no?: SortOrder
    branch_name?: SortOrder
    flat_no?: SortOrder
    street?: SortOrder
    centre_jurisdiction?: SortOrder
    centre_code?: SortOrder
    state_jurisdiction?: SortOrder
    cancellation_date?: SortOrder
    data_source?: SortOrder
    created_at?: SortOrder
  }

  export type central_gst_recordsMinOrderByAggregateInput = {
    id?: SortOrder
    gstin?: SortOrder
    pan?: SortOrder
    company_name?: SortOrder
    legal_name?: SortOrder
    trade_name?: SortOrder
    state?: SortOrder
    state_code?: SortOrder
    gst_status?: SortOrder
    gst_reg_date?: SortOrder
    taxpayer_type?: SortOrder
    constitution?: SortOrder
    address?: SortOrder
    city?: SortOrder
    pincode?: SortOrder
    location?: SortOrder
    district?: SortOrder
    branch_no?: SortOrder
    branch_name?: SortOrder
    flat_no?: SortOrder
    street?: SortOrder
    centre_jurisdiction?: SortOrder
    centre_code?: SortOrder
    state_jurisdiction?: SortOrder
    cancellation_date?: SortOrder
    data_source?: SortOrder
    created_at?: SortOrder
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type platform_settingsCountOrderByAggregateInput = {
    id?: SortOrder
    values?: SortOrder
    updated_at?: SortOrder
  }

  export type platform_settingsMaxOrderByAggregateInput = {
    id?: SortOrder
    updated_at?: SortOrder
  }

  export type platform_settingsMinOrderByAggregateInput = {
    id?: SortOrder
    updated_at?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type tenant_pricing_configsCountOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    base_price_paise?: SortOrder
    employee_cap?: SortOrder
    per_employee_excess_paise?: SortOrder
    discount_base_pct?: SortOrder
    discount_module_pct?: SortOrder
    discount_bundle_pct?: SortOrder
    bundle_trigger_count?: SortOrder
    discount_tenure_pct?: SortOrder
    tenure_months?: SortOrder
    offer_flat_paise?: SortOrder
    offer_expiry_date?: SortOrder
    is_stackable?: SortOrder
    final_override_paise?: SortOrder
    billing_cycle?: SortOrder
    updated_at?: SortOrder
  }

  export type tenant_pricing_configsAvgOrderByAggregateInput = {
    base_price_paise?: SortOrder
    employee_cap?: SortOrder
    per_employee_excess_paise?: SortOrder
    discount_base_pct?: SortOrder
    discount_bundle_pct?: SortOrder
    bundle_trigger_count?: SortOrder
    discount_tenure_pct?: SortOrder
    tenure_months?: SortOrder
    offer_flat_paise?: SortOrder
    final_override_paise?: SortOrder
  }

  export type tenant_pricing_configsMaxOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    base_price_paise?: SortOrder
    employee_cap?: SortOrder
    per_employee_excess_paise?: SortOrder
    discount_base_pct?: SortOrder
    discount_bundle_pct?: SortOrder
    bundle_trigger_count?: SortOrder
    discount_tenure_pct?: SortOrder
    tenure_months?: SortOrder
    offer_flat_paise?: SortOrder
    offer_expiry_date?: SortOrder
    is_stackable?: SortOrder
    final_override_paise?: SortOrder
    billing_cycle?: SortOrder
    updated_at?: SortOrder
  }

  export type tenant_pricing_configsMinOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    base_price_paise?: SortOrder
    employee_cap?: SortOrder
    per_employee_excess_paise?: SortOrder
    discount_base_pct?: SortOrder
    discount_bundle_pct?: SortOrder
    bundle_trigger_count?: SortOrder
    discount_tenure_pct?: SortOrder
    tenure_months?: SortOrder
    offer_flat_paise?: SortOrder
    offer_expiry_date?: SortOrder
    is_stackable?: SortOrder
    final_override_paise?: SortOrder
    billing_cycle?: SortOrder
    updated_at?: SortOrder
  }

  export type tenant_pricing_configsSumOrderByAggregateInput = {
    base_price_paise?: SortOrder
    employee_cap?: SortOrder
    per_employee_excess_paise?: SortOrder
    discount_base_pct?: SortOrder
    discount_bundle_pct?: SortOrder
    bundle_trigger_count?: SortOrder
    discount_tenure_pct?: SortOrder
    tenure_months?: SortOrder
    offer_flat_paise?: SortOrder
    final_override_paise?: SortOrder
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type invoicesCountOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    invoice_no?: SortOrder
    period_start?: SortOrder
    period_end?: SortOrder
    issue_date?: SortOrder
    due_date?: SortOrder
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    breakdown?: SortOrder
    pdf_url?: SortOrder
    payment_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type invoicesAvgOrderByAggregateInput = {
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
  }

  export type invoicesMaxOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    invoice_no?: SortOrder
    period_start?: SortOrder
    period_end?: SortOrder
    issue_date?: SortOrder
    due_date?: SortOrder
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    pdf_url?: SortOrder
    payment_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type invoicesMinOrderByAggregateInput = {
    id?: SortOrder
    tenant_id?: SortOrder
    invoice_no?: SortOrder
    period_start?: SortOrder
    period_end?: SortOrder
    issue_date?: SortOrder
    due_date?: SortOrder
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    pdf_url?: SortOrder
    payment_id?: SortOrder
    created_at?: SortOrder
    updated_at?: SortOrder
  }

  export type invoicesSumOrderByAggregateInput = {
    base_amount_paise?: SortOrder
    module_amount_paise?: SortOrder
    excess_amount_paise?: SortOrder
    discount_amount_paise?: SortOrder
    tax_amount_paise?: SortOrder
    total_paise?: SortOrder
  }

  export type tenant_modulesCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput> | tenant_modulesCreateWithoutTenantInput[] | tenant_modulesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_modulesCreateOrConnectWithoutTenantInput | tenant_modulesCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_modulesCreateManyTenantInputEnvelope
    connect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
  }

  export type central_user_indexCreateNestedManyWithoutTenantInput = {
    create?: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput> | central_user_indexCreateWithoutTenantInput[] | central_user_indexUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: central_user_indexCreateOrConnectWithoutTenantInput | central_user_indexCreateOrConnectWithoutTenantInput[]
    createMany?: central_user_indexCreateManyTenantInputEnvelope
    connect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
  }

  export type tenant_branch_linksCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput> | tenant_branch_linksCreateWithoutTenantInput[] | tenant_branch_linksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_branch_linksCreateOrConnectWithoutTenantInput | tenant_branch_linksCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_branch_linksCreateManyTenantInputEnvelope
    connect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
  }

  export type tenant_pricing_configsCreateNestedOneWithoutTenantInput = {
    create?: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: tenant_pricing_configsCreateOrConnectWithoutTenantInput
    connect?: tenant_pricing_configsWhereUniqueInput
  }

  export type invoicesCreateNestedManyWithoutTenantInput = {
    create?: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput> | invoicesCreateWithoutTenantInput[] | invoicesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: invoicesCreateOrConnectWithoutTenantInput | invoicesCreateOrConnectWithoutTenantInput[]
    createMany?: invoicesCreateManyTenantInputEnvelope
    connect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
  }

  export type tenant_modulesUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput> | tenant_modulesCreateWithoutTenantInput[] | tenant_modulesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_modulesCreateOrConnectWithoutTenantInput | tenant_modulesCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_modulesCreateManyTenantInputEnvelope
    connect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
  }

  export type central_user_indexUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput> | central_user_indexCreateWithoutTenantInput[] | central_user_indexUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: central_user_indexCreateOrConnectWithoutTenantInput | central_user_indexCreateOrConnectWithoutTenantInput[]
    createMany?: central_user_indexCreateManyTenantInputEnvelope
    connect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
  }

  export type tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput> | tenant_branch_linksCreateWithoutTenantInput[] | tenant_branch_linksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_branch_linksCreateOrConnectWithoutTenantInput | tenant_branch_linksCreateOrConnectWithoutTenantInput[]
    createMany?: tenant_branch_linksCreateManyTenantInputEnvelope
    connect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
  }

  export type tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput = {
    create?: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: tenant_pricing_configsCreateOrConnectWithoutTenantInput
    connect?: tenant_pricing_configsWhereUniqueInput
  }

  export type invoicesUncheckedCreateNestedManyWithoutTenantInput = {
    create?: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput> | invoicesCreateWithoutTenantInput[] | invoicesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: invoicesCreateOrConnectWithoutTenantInput | invoicesCreateOrConnectWithoutTenantInput[]
    createMany?: invoicesCreateManyTenantInputEnvelope
    connect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type tenant_modulesUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput> | tenant_modulesCreateWithoutTenantInput[] | tenant_modulesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_modulesCreateOrConnectWithoutTenantInput | tenant_modulesCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_modulesUpsertWithWhereUniqueWithoutTenantInput | tenant_modulesUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_modulesCreateManyTenantInputEnvelope
    set?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    disconnect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    delete?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    connect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    update?: tenant_modulesUpdateWithWhereUniqueWithoutTenantInput | tenant_modulesUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_modulesUpdateManyWithWhereWithoutTenantInput | tenant_modulesUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_modulesScalarWhereInput | tenant_modulesScalarWhereInput[]
  }

  export type central_user_indexUpdateManyWithoutTenantNestedInput = {
    create?: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput> | central_user_indexCreateWithoutTenantInput[] | central_user_indexUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: central_user_indexCreateOrConnectWithoutTenantInput | central_user_indexCreateOrConnectWithoutTenantInput[]
    upsert?: central_user_indexUpsertWithWhereUniqueWithoutTenantInput | central_user_indexUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: central_user_indexCreateManyTenantInputEnvelope
    set?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    disconnect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    delete?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    connect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    update?: central_user_indexUpdateWithWhereUniqueWithoutTenantInput | central_user_indexUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: central_user_indexUpdateManyWithWhereWithoutTenantInput | central_user_indexUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: central_user_indexScalarWhereInput | central_user_indexScalarWhereInput[]
  }

  export type tenant_branch_linksUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput> | tenant_branch_linksCreateWithoutTenantInput[] | tenant_branch_linksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_branch_linksCreateOrConnectWithoutTenantInput | tenant_branch_linksCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_branch_linksUpsertWithWhereUniqueWithoutTenantInput | tenant_branch_linksUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_branch_linksCreateManyTenantInputEnvelope
    set?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    disconnect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    delete?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    connect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    update?: tenant_branch_linksUpdateWithWhereUniqueWithoutTenantInput | tenant_branch_linksUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_branch_linksUpdateManyWithWhereWithoutTenantInput | tenant_branch_linksUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_branch_linksScalarWhereInput | tenant_branch_linksScalarWhereInput[]
  }

  export type tenant_pricing_configsUpdateOneWithoutTenantNestedInput = {
    create?: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: tenant_pricing_configsCreateOrConnectWithoutTenantInput
    upsert?: tenant_pricing_configsUpsertWithoutTenantInput
    disconnect?: tenant_pricing_configsWhereInput | boolean
    delete?: tenant_pricing_configsWhereInput | boolean
    connect?: tenant_pricing_configsWhereUniqueInput
    update?: XOR<XOR<tenant_pricing_configsUpdateToOneWithWhereWithoutTenantInput, tenant_pricing_configsUpdateWithoutTenantInput>, tenant_pricing_configsUncheckedUpdateWithoutTenantInput>
  }

  export type invoicesUpdateManyWithoutTenantNestedInput = {
    create?: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput> | invoicesCreateWithoutTenantInput[] | invoicesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: invoicesCreateOrConnectWithoutTenantInput | invoicesCreateOrConnectWithoutTenantInput[]
    upsert?: invoicesUpsertWithWhereUniqueWithoutTenantInput | invoicesUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: invoicesCreateManyTenantInputEnvelope
    set?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    disconnect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    delete?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    connect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    update?: invoicesUpdateWithWhereUniqueWithoutTenantInput | invoicesUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: invoicesUpdateManyWithWhereWithoutTenantInput | invoicesUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: invoicesScalarWhereInput | invoicesScalarWhereInput[]
  }

  export type tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput> | tenant_modulesCreateWithoutTenantInput[] | tenant_modulesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_modulesCreateOrConnectWithoutTenantInput | tenant_modulesCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_modulesUpsertWithWhereUniqueWithoutTenantInput | tenant_modulesUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_modulesCreateManyTenantInputEnvelope
    set?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    disconnect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    delete?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    connect?: tenant_modulesWhereUniqueInput | tenant_modulesWhereUniqueInput[]
    update?: tenant_modulesUpdateWithWhereUniqueWithoutTenantInput | tenant_modulesUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_modulesUpdateManyWithWhereWithoutTenantInput | tenant_modulesUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_modulesScalarWhereInput | tenant_modulesScalarWhereInput[]
  }

  export type central_user_indexUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput> | central_user_indexCreateWithoutTenantInput[] | central_user_indexUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: central_user_indexCreateOrConnectWithoutTenantInput | central_user_indexCreateOrConnectWithoutTenantInput[]
    upsert?: central_user_indexUpsertWithWhereUniqueWithoutTenantInput | central_user_indexUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: central_user_indexCreateManyTenantInputEnvelope
    set?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    disconnect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    delete?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    connect?: central_user_indexWhereUniqueInput | central_user_indexWhereUniqueInput[]
    update?: central_user_indexUpdateWithWhereUniqueWithoutTenantInput | central_user_indexUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: central_user_indexUpdateManyWithWhereWithoutTenantInput | central_user_indexUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: central_user_indexScalarWhereInput | central_user_indexScalarWhereInput[]
  }

  export type tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput> | tenant_branch_linksCreateWithoutTenantInput[] | tenant_branch_linksUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: tenant_branch_linksCreateOrConnectWithoutTenantInput | tenant_branch_linksCreateOrConnectWithoutTenantInput[]
    upsert?: tenant_branch_linksUpsertWithWhereUniqueWithoutTenantInput | tenant_branch_linksUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: tenant_branch_linksCreateManyTenantInputEnvelope
    set?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    disconnect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    delete?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    connect?: tenant_branch_linksWhereUniqueInput | tenant_branch_linksWhereUniqueInput[]
    update?: tenant_branch_linksUpdateWithWhereUniqueWithoutTenantInput | tenant_branch_linksUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: tenant_branch_linksUpdateManyWithWhereWithoutTenantInput | tenant_branch_linksUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: tenant_branch_linksScalarWhereInput | tenant_branch_linksScalarWhereInput[]
  }

  export type tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput = {
    create?: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
    connectOrCreate?: tenant_pricing_configsCreateOrConnectWithoutTenantInput
    upsert?: tenant_pricing_configsUpsertWithoutTenantInput
    disconnect?: tenant_pricing_configsWhereInput | boolean
    delete?: tenant_pricing_configsWhereInput | boolean
    connect?: tenant_pricing_configsWhereUniqueInput
    update?: XOR<XOR<tenant_pricing_configsUpdateToOneWithWhereWithoutTenantInput, tenant_pricing_configsUpdateWithoutTenantInput>, tenant_pricing_configsUncheckedUpdateWithoutTenantInput>
  }

  export type invoicesUncheckedUpdateManyWithoutTenantNestedInput = {
    create?: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput> | invoicesCreateWithoutTenantInput[] | invoicesUncheckedCreateWithoutTenantInput[]
    connectOrCreate?: invoicesCreateOrConnectWithoutTenantInput | invoicesCreateOrConnectWithoutTenantInput[]
    upsert?: invoicesUpsertWithWhereUniqueWithoutTenantInput | invoicesUpsertWithWhereUniqueWithoutTenantInput[]
    createMany?: invoicesCreateManyTenantInputEnvelope
    set?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    disconnect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    delete?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    connect?: invoicesWhereUniqueInput | invoicesWhereUniqueInput[]
    update?: invoicesUpdateWithWhereUniqueWithoutTenantInput | invoicesUpdateWithWhereUniqueWithoutTenantInput[]
    updateMany?: invoicesUpdateManyWithWhereWithoutTenantInput | invoicesUpdateManyWithWhereWithoutTenantInput[]
    deleteMany?: invoicesScalarWhereInput | invoicesScalarWhereInput[]
  }

  export type tenantsCreateNestedOneWithoutTenant_modulesInput = {
    create?: XOR<tenantsCreateWithoutTenant_modulesInput, tenantsUncheckedCreateWithoutTenant_modulesInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_modulesInput
    connect?: tenantsWhereUniqueInput
  }

  export type tenantsUpdateOneRequiredWithoutTenant_modulesNestedInput = {
    create?: XOR<tenantsCreateWithoutTenant_modulesInput, tenantsUncheckedCreateWithoutTenant_modulesInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_modulesInput
    upsert?: tenantsUpsertWithoutTenant_modulesInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutTenant_modulesInput, tenantsUpdateWithoutTenant_modulesInput>, tenantsUncheckedUpdateWithoutTenant_modulesInput>
  }

  export type tenantsCreateNestedOneWithoutCentral_user_indexInput = {
    create?: XOR<tenantsCreateWithoutCentral_user_indexInput, tenantsUncheckedCreateWithoutCentral_user_indexInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutCentral_user_indexInput
    connect?: tenantsWhereUniqueInput
  }

  export type tenantsUpdateOneRequiredWithoutCentral_user_indexNestedInput = {
    create?: XOR<tenantsCreateWithoutCentral_user_indexInput, tenantsUncheckedCreateWithoutCentral_user_indexInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutCentral_user_indexInput
    upsert?: tenantsUpsertWithoutCentral_user_indexInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutCentral_user_indexInput, tenantsUpdateWithoutCentral_user_indexInput>, tenantsUncheckedUpdateWithoutCentral_user_indexInput>
  }

  export type tenantsCreateNestedOneWithoutTenant_branch_linksInput = {
    create?: XOR<tenantsCreateWithoutTenant_branch_linksInput, tenantsUncheckedCreateWithoutTenant_branch_linksInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_branch_linksInput
    connect?: tenantsWhereUniqueInput
  }

  export type tenantsUpdateOneRequiredWithoutTenant_branch_linksNestedInput = {
    create?: XOR<tenantsCreateWithoutTenant_branch_linksInput, tenantsUncheckedCreateWithoutTenant_branch_linksInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_branch_linksInput
    upsert?: tenantsUpsertWithoutTenant_branch_linksInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutTenant_branch_linksInput, tenantsUpdateWithoutTenant_branch_linksInput>, tenantsUncheckedUpdateWithoutTenant_branch_linksInput>
  }

  export type tenantsCreateNestedOneWithoutTenant_pricing_configsInput = {
    create?: XOR<tenantsCreateWithoutTenant_pricing_configsInput, tenantsUncheckedCreateWithoutTenant_pricing_configsInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_pricing_configsInput
    connect?: tenantsWhereUniqueInput
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type tenantsUpdateOneRequiredWithoutTenant_pricing_configsNestedInput = {
    create?: XOR<tenantsCreateWithoutTenant_pricing_configsInput, tenantsUncheckedCreateWithoutTenant_pricing_configsInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutTenant_pricing_configsInput
    upsert?: tenantsUpsertWithoutTenant_pricing_configsInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutTenant_pricing_configsInput, tenantsUpdateWithoutTenant_pricing_configsInput>, tenantsUncheckedUpdateWithoutTenant_pricing_configsInput>
  }

  export type tenantsCreateNestedOneWithoutInvoicesInput = {
    create?: XOR<tenantsCreateWithoutInvoicesInput, tenantsUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutInvoicesInput
    connect?: tenantsWhereUniqueInput
  }

  export type tenantsUpdateOneRequiredWithoutInvoicesNestedInput = {
    create?: XOR<tenantsCreateWithoutInvoicesInput, tenantsUncheckedCreateWithoutInvoicesInput>
    connectOrCreate?: tenantsCreateOrConnectWithoutInvoicesInput
    upsert?: tenantsUpsertWithoutInvoicesInput
    connect?: tenantsWhereUniqueInput
    update?: XOR<XOR<tenantsUpdateToOneWithWhereWithoutInvoicesInput, tenantsUpdateWithoutInvoicesInput>, tenantsUncheckedUpdateWithoutInvoicesInput>
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedUuidNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableFilter<$PrismaModel> | string | null
  }

  export type NestedUuidNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type tenant_modulesCreateWithoutTenantInput = {
    id?: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
  }

  export type tenant_modulesUncheckedCreateWithoutTenantInput = {
    id?: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
  }

  export type tenant_modulesCreateOrConnectWithoutTenantInput = {
    where: tenant_modulesWhereUniqueInput
    create: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput>
  }

  export type tenant_modulesCreateManyTenantInputEnvelope = {
    data: tenant_modulesCreateManyTenantInput | tenant_modulesCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type central_user_indexCreateWithoutTenantInput = {
    id?: string
    email: string
    subdomain: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type central_user_indexUncheckedCreateWithoutTenantInput = {
    id?: string
    email: string
    subdomain: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type central_user_indexCreateOrConnectWithoutTenantInput = {
    where: central_user_indexWhereUniqueInput
    create: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput>
  }

  export type central_user_indexCreateManyTenantInputEnvelope = {
    data: central_user_indexCreateManyTenantInput | central_user_indexCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type tenant_branch_linksCreateWithoutTenantInput = {
    id?: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
  }

  export type tenant_branch_linksUncheckedCreateWithoutTenantInput = {
    id?: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
  }

  export type tenant_branch_linksCreateOrConnectWithoutTenantInput = {
    where: tenant_branch_linksWhereUniqueInput
    create: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput>
  }

  export type tenant_branch_linksCreateManyTenantInputEnvelope = {
    data: tenant_branch_linksCreateManyTenantInput | tenant_branch_linksCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type tenant_pricing_configsCreateWithoutTenantInput = {
    id?: string
    base_price_paise?: number
    employee_cap?: number | null
    per_employee_excess_paise?: number | null
    discount_base_pct?: Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: number | null
    discount_tenure_pct?: Decimal | DecimalJsLike | number | string | null
    tenure_months?: number | null
    offer_flat_paise?: number | null
    offer_expiry_date?: Date | string | null
    is_stackable?: boolean | null
    final_override_paise?: number | null
    billing_cycle?: string | null
    updated_at?: Date | string | null
  }

  export type tenant_pricing_configsUncheckedCreateWithoutTenantInput = {
    id?: string
    base_price_paise?: number
    employee_cap?: number | null
    per_employee_excess_paise?: number | null
    discount_base_pct?: Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: number | null
    discount_tenure_pct?: Decimal | DecimalJsLike | number | string | null
    tenure_months?: number | null
    offer_flat_paise?: number | null
    offer_expiry_date?: Date | string | null
    is_stackable?: boolean | null
    final_override_paise?: number | null
    billing_cycle?: string | null
    updated_at?: Date | string | null
  }

  export type tenant_pricing_configsCreateOrConnectWithoutTenantInput = {
    where: tenant_pricing_configsWhereUniqueInput
    create: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
  }

  export type invoicesCreateWithoutTenantInput = {
    id?: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type invoicesUncheckedCreateWithoutTenantInput = {
    id?: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type invoicesCreateOrConnectWithoutTenantInput = {
    where: invoicesWhereUniqueInput
    create: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput>
  }

  export type invoicesCreateManyTenantInputEnvelope = {
    data: invoicesCreateManyTenantInput | invoicesCreateManyTenantInput[]
    skipDuplicates?: boolean
  }

  export type tenant_modulesUpsertWithWhereUniqueWithoutTenantInput = {
    where: tenant_modulesWhereUniqueInput
    update: XOR<tenant_modulesUpdateWithoutTenantInput, tenant_modulesUncheckedUpdateWithoutTenantInput>
    create: XOR<tenant_modulesCreateWithoutTenantInput, tenant_modulesUncheckedCreateWithoutTenantInput>
  }

  export type tenant_modulesUpdateWithWhereUniqueWithoutTenantInput = {
    where: tenant_modulesWhereUniqueInput
    data: XOR<tenant_modulesUpdateWithoutTenantInput, tenant_modulesUncheckedUpdateWithoutTenantInput>
  }

  export type tenant_modulesUpdateManyWithWhereWithoutTenantInput = {
    where: tenant_modulesScalarWhereInput
    data: XOR<tenant_modulesUpdateManyMutationInput, tenant_modulesUncheckedUpdateManyWithoutTenantInput>
  }

  export type tenant_modulesScalarWhereInput = {
    AND?: tenant_modulesScalarWhereInput | tenant_modulesScalarWhereInput[]
    OR?: tenant_modulesScalarWhereInput[]
    NOT?: tenant_modulesScalarWhereInput | tenant_modulesScalarWhereInput[]
    id?: UuidFilter<"tenant_modules"> | string
    tenant_id?: UuidFilter<"tenant_modules"> | string
    module_name?: StringFilter<"tenant_modules"> | string
    is_active?: BoolFilter<"tenant_modules"> | boolean
    custom_price_paise?: IntNullableFilter<"tenant_modules"> | number | null
    enabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
    disabled_at?: DateTimeNullableFilter<"tenant_modules"> | Date | string | null
  }

  export type central_user_indexUpsertWithWhereUniqueWithoutTenantInput = {
    where: central_user_indexWhereUniqueInput
    update: XOR<central_user_indexUpdateWithoutTenantInput, central_user_indexUncheckedUpdateWithoutTenantInput>
    create: XOR<central_user_indexCreateWithoutTenantInput, central_user_indexUncheckedCreateWithoutTenantInput>
  }

  export type central_user_indexUpdateWithWhereUniqueWithoutTenantInput = {
    where: central_user_indexWhereUniqueInput
    data: XOR<central_user_indexUpdateWithoutTenantInput, central_user_indexUncheckedUpdateWithoutTenantInput>
  }

  export type central_user_indexUpdateManyWithWhereWithoutTenantInput = {
    where: central_user_indexScalarWhereInput
    data: XOR<central_user_indexUpdateManyMutationInput, central_user_indexUncheckedUpdateManyWithoutTenantInput>
  }

  export type central_user_indexScalarWhereInput = {
    AND?: central_user_indexScalarWhereInput | central_user_indexScalarWhereInput[]
    OR?: central_user_indexScalarWhereInput[]
    NOT?: central_user_indexScalarWhereInput | central_user_indexScalarWhereInput[]
    id?: UuidFilter<"central_user_index"> | string
    email?: StringFilter<"central_user_index"> | string
    subdomain?: StringFilter<"central_user_index"> | string
    company_id?: UuidFilter<"central_user_index"> | string
    user_id?: UuidNullableFilter<"central_user_index"> | string | null
    is_platform_admin?: BoolFilter<"central_user_index"> | boolean
    is_active?: BoolFilter<"central_user_index"> | boolean
    created_at?: DateTimeFilter<"central_user_index"> | Date | string
    updated_at?: DateTimeFilter<"central_user_index"> | Date | string
  }

  export type tenant_branch_linksUpsertWithWhereUniqueWithoutTenantInput = {
    where: tenant_branch_linksWhereUniqueInput
    update: XOR<tenant_branch_linksUpdateWithoutTenantInput, tenant_branch_linksUncheckedUpdateWithoutTenantInput>
    create: XOR<tenant_branch_linksCreateWithoutTenantInput, tenant_branch_linksUncheckedCreateWithoutTenantInput>
  }

  export type tenant_branch_linksUpdateWithWhereUniqueWithoutTenantInput = {
    where: tenant_branch_linksWhereUniqueInput
    data: XOR<tenant_branch_linksUpdateWithoutTenantInput, tenant_branch_linksUncheckedUpdateWithoutTenantInput>
  }

  export type tenant_branch_linksUpdateManyWithWhereWithoutTenantInput = {
    where: tenant_branch_linksScalarWhereInput
    data: XOR<tenant_branch_linksUpdateManyMutationInput, tenant_branch_linksUncheckedUpdateManyWithoutTenantInput>
  }

  export type tenant_branch_linksScalarWhereInput = {
    AND?: tenant_branch_linksScalarWhereInput | tenant_branch_linksScalarWhereInput[]
    OR?: tenant_branch_linksScalarWhereInput[]
    NOT?: tenant_branch_linksScalarWhereInput | tenant_branch_linksScalarWhereInput[]
    id?: UuidFilter<"tenant_branch_links"> | string
    tenant_id?: UuidFilter<"tenant_branch_links"> | string
    gstin?: StringFilter<"tenant_branch_links"> | string
    pan?: StringFilter<"tenant_branch_links"> | string
    branch_name?: StringNullableFilter<"tenant_branch_links"> | string | null
    branch_no?: StringNullableFilter<"tenant_branch_links"> | string | null
    address?: StringNullableFilter<"tenant_branch_links"> | string | null
    city?: StringNullableFilter<"tenant_branch_links"> | string | null
    state?: StringNullableFilter<"tenant_branch_links"> | string | null
    pincode?: StringNullableFilter<"tenant_branch_links"> | string | null
    status?: StringFilter<"tenant_branch_links"> | string
    requested_at?: DateTimeFilter<"tenant_branch_links"> | Date | string
    approved_at?: DateTimeNullableFilter<"tenant_branch_links"> | Date | string | null
    note?: StringNullableFilter<"tenant_branch_links"> | string | null
  }

  export type tenant_pricing_configsUpsertWithoutTenantInput = {
    update: XOR<tenant_pricing_configsUpdateWithoutTenantInput, tenant_pricing_configsUncheckedUpdateWithoutTenantInput>
    create: XOR<tenant_pricing_configsCreateWithoutTenantInput, tenant_pricing_configsUncheckedCreateWithoutTenantInput>
    where?: tenant_pricing_configsWhereInput
  }

  export type tenant_pricing_configsUpdateToOneWithWhereWithoutTenantInput = {
    where?: tenant_pricing_configsWhereInput
    data: XOR<tenant_pricing_configsUpdateWithoutTenantInput, tenant_pricing_configsUncheckedUpdateWithoutTenantInput>
  }

  export type tenant_pricing_configsUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_pricing_configsUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    base_price_paise?: IntFieldUpdateOperationsInput | number
    employee_cap?: NullableIntFieldUpdateOperationsInput | number | null
    per_employee_excess_paise?: NullableIntFieldUpdateOperationsInput | number | null
    discount_base_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    discount_module_pct?: NullableJsonNullValueInput | InputJsonValue
    discount_bundle_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    bundle_trigger_count?: NullableIntFieldUpdateOperationsInput | number | null
    discount_tenure_pct?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    tenure_months?: NullableIntFieldUpdateOperationsInput | number | null
    offer_flat_paise?: NullableIntFieldUpdateOperationsInput | number | null
    offer_expiry_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    is_stackable?: NullableBoolFieldUpdateOperationsInput | boolean | null
    final_override_paise?: NullableIntFieldUpdateOperationsInput | number | null
    billing_cycle?: NullableStringFieldUpdateOperationsInput | string | null
    updated_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type invoicesUpsertWithWhereUniqueWithoutTenantInput = {
    where: invoicesWhereUniqueInput
    update: XOR<invoicesUpdateWithoutTenantInput, invoicesUncheckedUpdateWithoutTenantInput>
    create: XOR<invoicesCreateWithoutTenantInput, invoicesUncheckedCreateWithoutTenantInput>
  }

  export type invoicesUpdateWithWhereUniqueWithoutTenantInput = {
    where: invoicesWhereUniqueInput
    data: XOR<invoicesUpdateWithoutTenantInput, invoicesUncheckedUpdateWithoutTenantInput>
  }

  export type invoicesUpdateManyWithWhereWithoutTenantInput = {
    where: invoicesScalarWhereInput
    data: XOR<invoicesUpdateManyMutationInput, invoicesUncheckedUpdateManyWithoutTenantInput>
  }

  export type invoicesScalarWhereInput = {
    AND?: invoicesScalarWhereInput | invoicesScalarWhereInput[]
    OR?: invoicesScalarWhereInput[]
    NOT?: invoicesScalarWhereInput | invoicesScalarWhereInput[]
    id?: UuidFilter<"invoices"> | string
    tenant_id?: UuidFilter<"invoices"> | string
    invoice_no?: StringFilter<"invoices"> | string
    period_start?: DateTimeFilter<"invoices"> | Date | string
    period_end?: DateTimeFilter<"invoices"> | Date | string
    issue_date?: DateTimeFilter<"invoices"> | Date | string
    due_date?: DateTimeFilter<"invoices"> | Date | string
    base_amount_paise?: IntFilter<"invoices"> | number
    module_amount_paise?: IntFilter<"invoices"> | number
    excess_amount_paise?: IntFilter<"invoices"> | number
    discount_amount_paise?: IntFilter<"invoices"> | number
    tax_amount_paise?: IntFilter<"invoices"> | number
    total_paise?: IntFilter<"invoices"> | number
    currency?: StringFilter<"invoices"> | string
    status?: StringFilter<"invoices"> | string
    breakdown?: JsonNullableFilter<"invoices">
    pdf_url?: StringNullableFilter<"invoices"> | string | null
    payment_id?: StringNullableFilter<"invoices"> | string | null
    created_at?: DateTimeFilter<"invoices"> | Date | string
    updated_at?: DateTimeFilter<"invoices"> | Date | string
  }

  export type tenantsCreateWithoutTenant_modulesInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    central_user_index?: central_user_indexCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsCreateNestedOneWithoutTenantInput
    invoices?: invoicesCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutTenant_modulesInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    central_user_index?: central_user_indexUncheckedCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput
    invoices?: invoicesUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutTenant_modulesInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutTenant_modulesInput, tenantsUncheckedCreateWithoutTenant_modulesInput>
  }

  export type tenantsUpsertWithoutTenant_modulesInput = {
    update: XOR<tenantsUpdateWithoutTenant_modulesInput, tenantsUncheckedUpdateWithoutTenant_modulesInput>
    create: XOR<tenantsCreateWithoutTenant_modulesInput, tenantsUncheckedCreateWithoutTenant_modulesInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutTenant_modulesInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutTenant_modulesInput, tenantsUncheckedUpdateWithoutTenant_modulesInput>
  }

  export type tenantsUpdateWithoutTenant_modulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    central_user_index?: central_user_indexUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutTenant_modulesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    central_user_index?: central_user_indexUncheckedUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateWithoutCentral_user_indexInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsCreateNestedOneWithoutTenantInput
    invoices?: invoicesCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutCentral_user_indexInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesUncheckedCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput
    invoices?: invoicesUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutCentral_user_indexInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutCentral_user_indexInput, tenantsUncheckedCreateWithoutCentral_user_indexInput>
  }

  export type tenantsUpsertWithoutCentral_user_indexInput = {
    update: XOR<tenantsUpdateWithoutCentral_user_indexInput, tenantsUncheckedUpdateWithoutCentral_user_indexInput>
    create: XOR<tenantsCreateWithoutCentral_user_indexInput, tenantsUncheckedCreateWithoutCentral_user_indexInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutCentral_user_indexInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutCentral_user_indexInput, tenantsUncheckedUpdateWithoutCentral_user_indexInput>
  }

  export type tenantsUpdateWithoutCentral_user_indexInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutCentral_user_indexInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateWithoutTenant_branch_linksInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsCreateNestedOneWithoutTenantInput
    invoices?: invoicesCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutTenant_branch_linksInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesUncheckedCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexUncheckedCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput
    invoices?: invoicesUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutTenant_branch_linksInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutTenant_branch_linksInput, tenantsUncheckedCreateWithoutTenant_branch_linksInput>
  }

  export type tenantsUpsertWithoutTenant_branch_linksInput = {
    update: XOR<tenantsUpdateWithoutTenant_branch_linksInput, tenantsUncheckedUpdateWithoutTenant_branch_linksInput>
    create: XOR<tenantsCreateWithoutTenant_branch_linksInput, tenantsUncheckedCreateWithoutTenant_branch_linksInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutTenant_branch_linksInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutTenant_branch_linksInput, tenantsUncheckedUpdateWithoutTenant_branch_linksInput>
  }

  export type tenantsUpdateWithoutTenant_branch_linksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutTenant_branch_linksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUncheckedUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput
    invoices?: invoicesUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateWithoutTenant_pricing_configsInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksCreateNestedManyWithoutTenantInput
    invoices?: invoicesCreateNestedManyWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutTenant_pricing_configsInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesUncheckedCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexUncheckedCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput
    invoices?: invoicesUncheckedCreateNestedManyWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutTenant_pricing_configsInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutTenant_pricing_configsInput, tenantsUncheckedCreateWithoutTenant_pricing_configsInput>
  }

  export type tenantsUpsertWithoutTenant_pricing_configsInput = {
    update: XOR<tenantsUpdateWithoutTenant_pricing_configsInput, tenantsUncheckedUpdateWithoutTenant_pricing_configsInput>
    create: XOR<tenantsCreateWithoutTenant_pricing_configsInput, tenantsUncheckedCreateWithoutTenant_pricing_configsInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutTenant_pricing_configsInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutTenant_pricing_configsInput, tenantsUncheckedUpdateWithoutTenant_pricing_configsInput>
  }

  export type tenantsUpdateWithoutTenant_pricing_configsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUpdateManyWithoutTenantNestedInput
    invoices?: invoicesUpdateManyWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutTenant_pricing_configsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUncheckedUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput
    invoices?: invoicesUncheckedUpdateManyWithoutTenantNestedInput
  }

  export type tenantsCreateWithoutInvoicesInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsCreateNestedOneWithoutTenantInput
  }

  export type tenantsUncheckedCreateWithoutInvoicesInput = {
    id?: string
    name: string
    legal_name?: string | null
    subdomain: string
    custom_domain?: string | null
    logo_url?: string | null
    primary_color?: string | null
    background_color?: string | null
    background_url?: string | null
    sitemap_url?: string | null
    plan?: string
    plan_expires_at?: Date | string | null
    max_employees?: number
    db_mode?: string
    db_url?: string | null
    schema_name?: string | null
    local_db_type?: string | null
    local_db_host?: string | null
    local_db_port?: number | null
    local_db_name?: string | null
    local_db_user?: string | null
    local_db_pass?: string | null
    sync_interval_min?: number | null
    gstin?: string | null
    pan?: string | null
    city?: string | null
    state?: string | null
    address?: string | null
    pincode?: string | null
    gst_status?: string | null
    gst_reg_date?: string | null
    taxpayer_type?: string | null
    constitution?: string | null
    e_invoice_enabled?: boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: string | null
    admin_email?: string | null
    admin_phone?: string | null
    is_active?: boolean
    is_setup_complete?: boolean
    suspended_at?: Date | string | null
    suspension_reason?: string | null
    payout_config_enc?: string | null
    created_at?: Date | string
    updated_at?: Date | string
    deleted_at?: Date | string | null
    tenant_modules?: tenant_modulesUncheckedCreateNestedManyWithoutTenantInput
    central_user_index?: central_user_indexUncheckedCreateNestedManyWithoutTenantInput
    tenant_branch_links?: tenant_branch_linksUncheckedCreateNestedManyWithoutTenantInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedCreateNestedOneWithoutTenantInput
  }

  export type tenantsCreateOrConnectWithoutInvoicesInput = {
    where: tenantsWhereUniqueInput
    create: XOR<tenantsCreateWithoutInvoicesInput, tenantsUncheckedCreateWithoutInvoicesInput>
  }

  export type tenantsUpsertWithoutInvoicesInput = {
    update: XOR<tenantsUpdateWithoutInvoicesInput, tenantsUncheckedUpdateWithoutInvoicesInput>
    create: XOR<tenantsCreateWithoutInvoicesInput, tenantsUncheckedCreateWithoutInvoicesInput>
    where?: tenantsWhereInput
  }

  export type tenantsUpdateToOneWithWhereWithoutInvoicesInput = {
    where?: tenantsWhereInput
    data: XOR<tenantsUpdateWithoutInvoicesInput, tenantsUncheckedUpdateWithoutInvoicesInput>
  }

  export type tenantsUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUpdateOneWithoutTenantNestedInput
  }

  export type tenantsUncheckedUpdateWithoutInvoicesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    legal_name?: NullableStringFieldUpdateOperationsInput | string | null
    subdomain?: StringFieldUpdateOperationsInput | string
    custom_domain?: NullableStringFieldUpdateOperationsInput | string | null
    logo_url?: NullableStringFieldUpdateOperationsInput | string | null
    primary_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_color?: NullableStringFieldUpdateOperationsInput | string | null
    background_url?: NullableStringFieldUpdateOperationsInput | string | null
    sitemap_url?: NullableStringFieldUpdateOperationsInput | string | null
    plan?: StringFieldUpdateOperationsInput | string
    plan_expires_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    max_employees?: IntFieldUpdateOperationsInput | number
    db_mode?: StringFieldUpdateOperationsInput | string
    db_url?: NullableStringFieldUpdateOperationsInput | string | null
    schema_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_type?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_host?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_port?: NullableIntFieldUpdateOperationsInput | number | null
    local_db_name?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_user?: NullableStringFieldUpdateOperationsInput | string | null
    local_db_pass?: NullableStringFieldUpdateOperationsInput | string | null
    sync_interval_min?: NullableIntFieldUpdateOperationsInput | number | null
    gstin?: NullableStringFieldUpdateOperationsInput | string | null
    pan?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    gst_status?: NullableStringFieldUpdateOperationsInput | string | null
    gst_reg_date?: NullableStringFieldUpdateOperationsInput | string | null
    taxpayer_type?: NullableStringFieldUpdateOperationsInput | string | null
    constitution?: NullableStringFieldUpdateOperationsInput | string | null
    e_invoice_enabled?: NullableBoolFieldUpdateOperationsInput | boolean | null
    business_nature?: NullableJsonNullValueInput | InputJsonValue
    admin_name?: NullableStringFieldUpdateOperationsInput | string | null
    admin_email?: NullableStringFieldUpdateOperationsInput | string | null
    admin_phone?: NullableStringFieldUpdateOperationsInput | string | null
    is_active?: BoolFieldUpdateOperationsInput | boolean
    is_setup_complete?: BoolFieldUpdateOperationsInput | boolean
    suspended_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    suspension_reason?: NullableStringFieldUpdateOperationsInput | string | null
    payout_config_enc?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
    deleted_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    tenant_modules?: tenant_modulesUncheckedUpdateManyWithoutTenantNestedInput
    central_user_index?: central_user_indexUncheckedUpdateManyWithoutTenantNestedInput
    tenant_branch_links?: tenant_branch_linksUncheckedUpdateManyWithoutTenantNestedInput
    tenant_pricing_configs?: tenant_pricing_configsUncheckedUpdateOneWithoutTenantNestedInput
  }

  export type tenant_modulesCreateManyTenantInput = {
    id?: string
    module_name: string
    is_active?: boolean
    custom_price_paise?: number | null
    enabled_at?: Date | string | null
    disabled_at?: Date | string | null
  }

  export type central_user_indexCreateManyTenantInput = {
    id?: string
    email: string
    subdomain: string
    user_id?: string | null
    is_platform_admin?: boolean
    is_active?: boolean
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type tenant_branch_linksCreateManyTenantInput = {
    id?: string
    gstin: string
    pan: string
    branch_name?: string | null
    branch_no?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    status?: string
    requested_at?: Date | string
    approved_at?: Date | string | null
    note?: string | null
  }

  export type invoicesCreateManyTenantInput = {
    id?: string
    invoice_no: string
    period_start: Date | string
    period_end: Date | string
    issue_date?: Date | string
    due_date: Date | string
    base_amount_paise: number
    module_amount_paise: number
    excess_amount_paise: number
    discount_amount_paise: number
    tax_amount_paise?: number
    total_paise: number
    currency?: string
    status?: string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: string | null
    payment_id?: string | null
    created_at?: Date | string
    updated_at?: Date | string
  }

  export type tenant_modulesUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_modulesUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type tenant_modulesUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    module_name?: StringFieldUpdateOperationsInput | string
    is_active?: BoolFieldUpdateOperationsInput | boolean
    custom_price_paise?: NullableIntFieldUpdateOperationsInput | number | null
    enabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    disabled_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type central_user_indexUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_user_indexUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type central_user_indexUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    subdomain?: StringFieldUpdateOperationsInput | string
    user_id?: NullableStringFieldUpdateOperationsInput | string | null
    is_platform_admin?: BoolFieldUpdateOperationsInput | boolean
    is_active?: BoolFieldUpdateOperationsInput | boolean
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type tenant_branch_linksUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type tenant_branch_linksUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type tenant_branch_linksUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    gstin?: StringFieldUpdateOperationsInput | string
    pan?: StringFieldUpdateOperationsInput | string
    branch_name?: NullableStringFieldUpdateOperationsInput | string | null
    branch_no?: NullableStringFieldUpdateOperationsInput | string | null
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    state?: NullableStringFieldUpdateOperationsInput | string | null
    pincode?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    requested_at?: DateTimeFieldUpdateOperationsInput | Date | string
    approved_at?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    note?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type invoicesUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type invoicesUncheckedUpdateWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type invoicesUncheckedUpdateManyWithoutTenantInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoice_no?: StringFieldUpdateOperationsInput | string
    period_start?: DateTimeFieldUpdateOperationsInput | Date | string
    period_end?: DateTimeFieldUpdateOperationsInput | Date | string
    issue_date?: DateTimeFieldUpdateOperationsInput | Date | string
    due_date?: DateTimeFieldUpdateOperationsInput | Date | string
    base_amount_paise?: IntFieldUpdateOperationsInput | number
    module_amount_paise?: IntFieldUpdateOperationsInput | number
    excess_amount_paise?: IntFieldUpdateOperationsInput | number
    discount_amount_paise?: IntFieldUpdateOperationsInput | number
    tax_amount_paise?: IntFieldUpdateOperationsInput | number
    total_paise?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    breakdown?: NullableJsonNullValueInput | InputJsonValue
    pdf_url?: NullableStringFieldUpdateOperationsInput | string | null
    payment_id?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    updated_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}