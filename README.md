# Controle de vendas

## Como rodar o app

> **Importante**
>
> Este projeto utiliza **módulos nativos**. Por isso, **Expo Go** pode não funcionar corretamente e o emulador pode não reproduzir todos os recursos. O recomendado é utilizar um **dispositivo Android físico** conectado via USB.

### Pré-requisitos

- Node.js
- Android Studio (SDK e Platform Tools)
- Java 21 (ou 17)
- ADB configurado no `PATH`

### Instalação

```bash
npm install
```

### Rodando em desenvolvimento

Conecte o dispositivo Android via USB e verifique se ele foi reconhecido:

```bash
adb devices
```

Instale o app de desenvolvimento:

```bash
npx expo run:android
```

Inicie o servidor Metro:

```bash
npx expo start --dev-client
```

Caso necessário, faça o redirecionamento da porta:

```bash
adb reverse tcp:8081 tcp:8081
```

Abra o aplicativo no dispositivo. As alterações no código serão atualizadas automaticamente via **Fast Refresh**.

## Gerando um build

### APK de debug

```bash
cd android
./gradlew assembleDebug
```

O APK será gerado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### APK de release

```bash
cd android
./gradlew assembleRelease
```

O APK será gerado em:

```text
android/app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (AAB)

```bash
cd android
./gradlew bundleRelease
```

O arquivo será gerado em:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## Problemas comuns

### `Unsupported class file major version 69`

Esse erro ocorre ao utilizar **Java 25**. Utilize **Java 21** (ou 17) para compilar o projeto.

### Dispositivo não aparece

Verifique se a depuração USB está habilitada e confirme a conexão:

```bash
adb devices
```

