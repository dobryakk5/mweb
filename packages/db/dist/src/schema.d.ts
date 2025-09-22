export declare const usersSchema: import(
  'drizzle-orm/pg-core',
).PgSchema<'users'>
export declare const users: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'users'
  schema: 'users'
  columns: {
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at'
        tableName: 'users'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'users'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    username: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'username'
        tableName: 'users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    email: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'email'
        tableName: 'users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    firstName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'first_name'
        tableName: 'users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    lastName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'last_name'
        tableName: 'users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: true
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
  }
  dialect: 'pg'
}>
export declare const telegramUsers: import(
  'drizzle-orm/pg-core',
).PgTableWithColumns<{
  name: 'telegram_users'
  schema: 'users'
  columns: {
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at'
        tableName: 'telegram_users'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'telegram_users'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    tgUserId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'tg_user_id'
        tableName: 'telegram_users'
        dataType: 'number'
        columnType: 'PgBigInt53'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    firstName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'first_name'
        tableName: 'telegram_users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    lastName: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'last_name'
        tableName: 'telegram_users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    username: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'username'
        tableName: 'telegram_users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    photoUrl: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'photo_url'
        tableName: 'telegram_users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'telegram_users'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: true
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
  }
  dialect: 'pg'
}>
export declare const sessions: import(
  'drizzle-orm/pg-core',
).PgTableWithColumns<{
  name: 'sessions'
  schema: 'users'
  columns: {
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at'
        tableName: 'sessions'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'sessions'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    tgUserId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'tg_user_id'
        tableName: 'sessions'
        dataType: 'number'
        columnType: 'PgBigInt53'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    sessionToken: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'session_token'
        tableName: 'sessions'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    expiresAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'expires_at'
        tableName: 'sessions'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'sessions'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: true
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
  }
  dialect: 'pg'
}>
export declare const userFlats: import(
  'drizzle-orm/pg-core',
).PgTableWithColumns<{
  name: 'user_flats'
  schema: 'users'
  columns: {
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at'
        tableName: 'user_flats'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'user_flats'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'user_flats'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: 'always'
        generated: undefined
      },
      {},
      {}
    >
    tgUserId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'tg_user_id'
        tableName: 'user_flats'
        dataType: 'number'
        columnType: 'PgBigInt53'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    address: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'address'
        tableName: 'user_flats'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    rooms: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'rooms'
        tableName: 'user_flats'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    floor: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'floor'
        tableName: 'user_flats'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
  }
  dialect: 'pg'
}>
export declare const ads: import('drizzle-orm/pg-core').PgTableWithColumns<{
  name: 'ads'
  schema: 'users'
  columns: {
    createdAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'created_at'
        tableName: 'ads'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'ads'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: 'always'
        generated: undefined
      },
      {},
      {}
    >
    flatId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'flat_id'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    url: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'url'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    address: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'address'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    price: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'price'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    rooms: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'rooms'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    views: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'views'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    totalArea: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'total_area'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgNumeric'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    livingArea: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'living_area'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgNumeric'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    kitchenArea: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'kitchen_area'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgNumeric'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    floor: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'floor'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    totalFloors: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'total_floors'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    bathroom: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'bathroom'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    balcony: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'balcony'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    renovation: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'renovation'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    furniture: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'furniture'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    constructionYear: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'construction_year'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    houseType: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'house_type'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    ceilingHeight: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'ceiling_height'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgNumeric'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    metroStation: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metro_station'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    metroTime: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'metro_time'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgVarchar'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {
        length: number | undefined
      }
    >
    tags: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'tags'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgText'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    description: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'description'
        tableName: 'ads'
        dataType: 'string'
        columnType: 'PgText'
        data: string
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    photoUrls: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'photo_urls'
        tableName: 'ads'
        dataType: 'array'
        columnType: 'PgArray'
        data: string[]
        driverParam: string | string[]
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: [string, ...string[]]
        baseColumn: import('drizzle-orm').Column<
          {
            name: 'photo_urls'
            tableName: 'ads'
            dataType: 'string'
            columnType: 'PgText'
            data: string
            driverParam: string
            notNull: false
            hasDefault: false
            isPrimaryKey: false
            isAutoincrement: false
            hasRuntimeDefault: false
            enumValues: [string, ...string[]]
            baseColumn: never
            identity: undefined
            generated: undefined
          },
          {},
          {}
        >
        identity: undefined
        generated: undefined
      },
      {},
      {
        baseBuilder: import('drizzle-orm/pg-core').PgColumnBuilder<
          {
            name: 'photo_urls'
            dataType: 'string'
            columnType: 'PgText'
            data: string
            enumValues: [string, ...string[]]
            driverParam: string
          },
          {},
          {},
          import('drizzle-orm').ColumnBuilderExtraConfig
        >
        size: undefined
      }
    >
    source: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'source'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    status: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'status'
        tableName: 'ads'
        dataType: 'boolean'
        columnType: 'PgBoolean'
        data: boolean
        driverParam: boolean
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    viewsToday: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'views_today'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    from: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'from'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    sma: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'sma'
        tableName: 'ads'
        dataType: 'number'
        columnType: 'PgSmallInt'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    sourceCreated: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'source_created'
        tableName: 'ads'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    sourceUpdated: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'source_updated'
        tableName: 'ads'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
  }
  dialect: 'pg'
}>
export declare const adHistory: import(
  'drizzle-orm/pg-core',
).PgTableWithColumns<{
  name: 'ad_history'
  schema: 'users'
  columns: {
    id: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'id'
        tableName: 'ad_history'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: true
        isPrimaryKey: true
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: 'always'
        generated: undefined
      },
      {},
      {}
    >
    adId: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'ad_id'
        tableName: 'ad_history'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: true
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    price: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'price'
        tableName: 'ad_history'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    viewsToday: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'views_today'
        tableName: 'ad_history'
        dataType: 'number'
        columnType: 'PgInteger'
        data: number
        driverParam: string | number
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    recordedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'recorded_at'
        tableName: 'ad_history'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: false
        hasDefault: true
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    status: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'status'
        tableName: 'ad_history'
        dataType: 'boolean'
        columnType: 'PgBoolean'
        data: boolean
        driverParam: boolean
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
    updatedAt: import('drizzle-orm/pg-core').PgColumn<
      {
        name: 'updated_at'
        tableName: 'ad_history'
        dataType: 'date'
        columnType: 'PgTimestamp'
        data: Date
        driverParam: string
        notNull: false
        hasDefault: false
        isPrimaryKey: false
        isAutoincrement: false
        hasRuntimeDefault: false
        enumValues: undefined
        baseColumn: never
        identity: undefined
        generated: undefined
      },
      {},
      {}
    >
  }
  dialect: 'pg'
}>
export declare const userFlatsRelations: import('drizzle-orm').Relations<
  'user_flats',
  {
    ads: import('drizzle-orm').Many<'ads'>
  }
>
export declare const adsRelations: import('drizzle-orm').Relations<
  'ads',
  {
    flat: import('drizzle-orm').One<'user_flats', true>
    history: import('drizzle-orm').Many<'ad_history'>
  }
>
export declare const adHistoryRelations: import('drizzle-orm').Relations<
  'ad_history',
  {
    ad: import('drizzle-orm').One<'ads', true>
  }
>
//# sourceMappingURL=schema.d.ts.map
